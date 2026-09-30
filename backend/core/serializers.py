from rest_framework import serializers
from .models import Zone, ScrapedWeatherData, FWICalculation, ScraperLog

class ZoneSerializer(serializers.ModelSerializer):
    latest_fwi = serializers.SerializerMethodField()
    latest_danger_level = serializers.SerializerMethodField()

    class Meta:
        model = Zone
        fields = ['id', 'name', 'latitude', 'longitude', 'country', 'region', 'description', 'is_active', 'created_at', 'latest_fwi', 'latest_danger_level']

    def get_latest_fwi(self, obj):
        latest = FWICalculation.objects.filter(zone=obj).order_by('-date').first()
        return latest.fwi if latest else None

    def get_latest_danger_level(self, obj):
        latest = FWICalculation.objects.filter(zone=obj).order_by('-date').first()
        return latest.get_danger_level_display() if latest else 'Sin Datos'


class ScrapedWeatherDataSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True)

    class Meta:
        model = ScrapedWeatherData
        fields = ['id', 'zone', 'zone_name', 'date', 'temperature', 'relative_humidity', 'wind_speed', 'rain_24h', 'scraped_at']


class FWICalculationSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    danger_level_display = serializers.CharField(source='get_danger_level_display', read_only=True)
    weather_data_detail = ScrapedWeatherDataSerializer(source='weather_data', read_only=True)

    class Meta:
        model = FWICalculation
        fields = [
            'id', 'zone', 'zone_name', 'date', 'weather_data', 'weather_data_detail',
            'ffmc', 'dmc', 'dc', 'isi', 'bui', 'fwi', 'dsr',
            'danger_level', 'danger_level_display', 'calculated_at'
        ]


class ScraperLogSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ScraperLog
        fields = ['id', 'zone', 'zone_name', 'status', 'status_display', 'source', 'records_created', 'message', 'executed_at']
