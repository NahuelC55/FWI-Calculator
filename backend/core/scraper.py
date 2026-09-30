import logging
import requests
from datetime import datetime, timedelta, date
from django.utils import timezone
from .models import Zone, ScrapedWeatherData, FWICalculation, ScraperLog
from .fwi_engine import compute_fwi_record

logger = logging.getLogger(__name__)

OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


def fetch_open_meteo_weather(lat: float, lon: float, start_date_str: str, end_date_str: str) -> list:
    """
    Fetches hourly weather data from Open-Meteo API for a given lat/lon and date range.
    Returns a list of dicts: [{'date': 'YYYY-MM-DD', 'temperature': float, 'relative_humidity': float, 'wind_speed': float, 'rain_24h': float}]
    """
    # Decide whether to use archive endpoint (for past dates) or forecast endpoint (recent/today)
    today_str = datetime.now().strftime("%Y-%m-%d")
    url = OPEN_METEO_ARCHIVE_URL if end_date_str < today_str else OPEN_METEO_FORECAST_URL

    params = {
        'latitude': lat,
        'longitude': lon,
        'start_date': start_date_str,
        'end_date': end_date_str,
        'hourly': 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation',
        'timezone': 'auto'
    }

    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        # Fallback to forecast URL if archive fails or vice versa
        logger.warning(f"Primary Open-Meteo fetch failed ({e}), trying fallback URL...")
        alt_url = OPEN_METEO_FORECAST_URL if url == OPEN_METEO_ARCHIVE_URL else OPEN_METEO_ARCHIVE_URL
        response = requests.get(alt_url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()

    hourly = data.get('hourly', {})
    times = hourly.get('time', [])
    temps = hourly.get('temperature_2m', [])
    rhs = hourly.get('relative_humidity_2m', [])
    winds = hourly.get('wind_speed_10m', [])
    precips = hourly.get('precipitation', [])

    # Group data by date
    daily_buckets = {}
    for idx, t_str in enumerate(times):
        # Format of t_str: "2026-09-30T12:00"
        parts = t_str.split('T')
        d_str = parts[0]
        hour_str = parts[1].split(':')[0] if len(parts) > 1 else '00'

        if d_str not in daily_buckets:
            daily_buckets[d_str] = {
                'noon_temp': None,
                'noon_rh': None,
                'noon_wind': None,
                'hourly_precip': []
            }

        temp_val = temps[idx] if idx < len(temps) and temps[idx] is not None else 20.0
        rh_val = rhs[idx] if idx < len(rhs) and rhs[idx] is not None else 50.0
        wind_val = winds[idx] if idx < len(winds) and winds[idx] is not None else 10.0
        precip_val = precips[idx] if idx < len(precips) and precips[idx] is not None else 0.0

        daily_buckets[d_str]['hourly_precip'].append(precip_val)

        # Capture noon values (hour '12') or nearest to 12
        if hour_str == '12' or daily_buckets[d_str]['noon_temp'] is None:
            daily_buckets[d_str]['noon_temp'] = temp_val
            daily_buckets[d_str]['noon_rh'] = rh_val
            daily_buckets[d_str]['noon_wind'] = wind_val

    results = []
    for d_str, bucket in daily_buckets.items():
        rain_24h = sum(bucket['hourly_precip'])
        results.append({
            'date': d_str,
            'temperature': round(bucket['noon_temp'], 1),
            'relative_humidity': round(bucket['noon_rh'], 1),
            'wind_speed': round(bucket['noon_wind'], 1),
            'rain_24h': round(rain_24h, 1)
        })

    return results


def run_scraper_for_zone(zone: Zone, start_date_str: str = None, end_date_str: str = None) -> dict:
    """
    Scrapes weather data for a specified Zone and date range, updates DB and recalculates FWI.
    If start_date_str and end_date_str are not provided, defaults to the past 7 days up to today.
    """
    if not end_date_str:
        end_date_str = datetime.now().strftime("%Y-%m-%d")
    if not start_date_str:
        # Default to 7 days prior
        start_dt = datetime.now() - timedelta(days=7)
        start_date_str = start_dt.strftime("%Y-%m-%d")

    records_count = 0
    try:
        weather_records = fetch_open_meteo_weather(zone.latitude, zone.longitude, start_date_str, end_date_str)
        
        for item in weather_records:
            rec_date = datetime.strptime(item['date'], "%Y-%m-%d").date()
            ScrapedWeatherData.objects.update_or_create(
                zone=zone,
                date=rec_date,
                defaults={
                    'temperature': item['temperature'],
                    'relative_humidity': item['relative_humidity'],
                    'wind_speed': item['wind_speed'],
                    'rain_24h': item['rain_24h'],
                }
            )
            records_count += 1

        # Calculate FWI for zone sequentially to ensure accurate moisture code propagation
        recalculate_fwi_for_zone(zone)

        log = ScraperLog.objects.create(
            zone=zone,
            status='SUCCESS',
            source='Open-Meteo Meteorological Service',
            records_created=records_count,
            message=f"Se recopilaron {records_count} registros climáticos desde {start_date_str} hasta {end_date_str} para la zona '{zone.name}'."
        )

        return {
            'success': True,
            'zone': zone.name,
            'records': records_count,
            'message': log.message
        }

    except Exception as e:
        error_msg = f"Error en scraper para zona '{zone.name}': {str(e)}"
        logger.error(error_msg)
        ScraperLog.objects.create(
            zone=zone,
            status='ERROR',
            source='Open-Meteo Meteorological Service',
            records_created=0,
            message=error_msg
        )
        return {
            'success': False,
            'zone': zone.name,
            'error': str(e)
        }


def recalculate_fwi_for_zone(zone: Zone):
    """
    Recalculates FWI for all weather data entries of a zone ordered by date ascending.
    Propagates FFMC, DMC, DC from day to day.
    """
    weather_entries = ScrapedWeatherData.objects.filter(zone=zone).order_by('date')
    
    ffmc_prev = 85.0
    dmc_prev = 6.0
    dc_prev = 15.0

    for w_entry in weather_entries:
        month = w_entry.date.month
        
        calc_res = compute_fwi_record(
            temp=w_entry.temperature,
            rh=w_entry.relative_humidity,
            wind=w_entry.wind_speed,
            rain=w_entry.rain_24h,
            month=month,
            ffmc_prev=ffmc_prev,
            dmc_prev=dmc_prev,
            dc_prev=dc_prev,
            latitude=zone.latitude
        )

        fwi_obj, created = FWICalculation.objects.update_or_create(
            zone=zone,
            date=w_entry.date,
            defaults={
                'weather_data': w_entry,
                'ffmc': calc_res['ffmc'],
                'dmc': calc_res['dmc'],
                'dc': calc_res['dc'],
                'isi': calc_res['isi'],
                'bui': calc_res['bui'],
                'fwi': calc_res['fwi'],
                'dsr': calc_res['dsr'],
                'danger_level': calc_res['danger_level'],
            }
        )

        # Update previous values for next day's calculation
        ffmc_prev = calc_res['ffmc']
        dmc_prev = calc_res['dmc']
        dc_prev = calc_res['dc']
