import csv
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Avg, Max, Count

from .models import Zone, ScrapedWeatherData, FWICalculation, ScraperLog
from .serializers import ZoneSerializer, ScrapedWeatherDataSerializer, FWICalculationSerializer, ScraperLogSerializer
from .scraper import run_scraper_for_zone, recalculate_fwi_for_zone


class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer

    @action(detail=True, methods=['post'])
    def trigger_scrape(self, request, pk=None):
        zone = self.get_object()
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        result = run_scraper_for_zone(zone, start_date, end_date)
        return Response(result, status=status.HTTP_200_OK if result.get('success') else status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def recalculate(self, request, pk=None):
        zone = self.get_object()
        recalculate_fwi_for_zone(zone)
        return Response({'message': f"FWI recalculado exitosamente para la zona '{zone.name}'."})


class FWICalculationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FWICalculation.objects.all().select_related('zone', 'weather_data')
    serializer_class = FWICalculationSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        zone_id = self.request.query_params.get('zone_id')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if zone_id:
            queryset = queryset.filter(zone_id=zone_id)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset


class ScraperLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ScraperLog.objects.all().select_related('zone')
    serializer_class = ScraperLogSerializer


class RunScraperAPIView(APIView):
    def post(self, request):
        zone_id = request.data.get('zone_id')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')

        if zone_id:
            try:
                zone = Zone.objects.get(id=zone_id)
                res = run_scraper_for_zone(zone, start_date, end_date)
                return Response([res])
            except Zone.DoesNotExist:
                return Response({'error': 'La zona especificada no existe.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            active_zones = Zone.objects.filter(is_active=True)
            if not active_zones.exists():
                return Response({'error': 'No hay zonas activas configuradas para raspar.'}, status=status.HTTP_400_BAD_REQUEST)
            
            results = []
            for z in active_zones:
                res = run_scraper_for_zone(z, start_date, end_date)
                results.append(res)
            return Response(results)


class DashboardSummaryAPIView(APIView):
    def get(self, request):
        total_zones = Zone.objects.count()
        active_zones = Zone.objects.filter(is_active=True).count()
        total_records = ScrapedWeatherData.objects.count()
        total_calculations = FWICalculation.objects.count()

        latest_calculations = []
        for zone in Zone.objects.filter(is_active=True):
            latest_fwi = FWICalculation.objects.filter(zone=zone).order_by('-date').first()
            if latest_fwi:
                latest_calculations.append(FWICalculationSerializer(latest_fwi).data)

        # High risk count
        high_risk_count = FWICalculation.objects.filter(danger_level__in=['HIGH', 'VERY_HIGH', 'EXTREME']).values('zone').distinct().count()

        return Response({
            'total_zones': total_zones,
            'active_zones': active_zones,
            'total_records': total_records,
            'total_calculations': total_calculations,
            'high_risk_zones': high_risk_count,
            'latest_calculations': latest_calculations
        })


class ExportFWICSVAPIView(APIView):
    def get(self, request):
        zone_id = request.query_params.get('zone_id')
        queryset = FWICalculation.objects.all().select_related('zone', 'weather_data').order_by('-date')

        if zone_id:
            queryset = queryset.filter(zone_id=zone_id)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="fwi_historico.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Zona', 'Latitud', 'Longitud', 'Fecha', 
            'Temperatura (°C)', 'Humedad Relativa (%)', 'Viento (km/h)', 'Lluvia 24h (mm)',
            'FFMC', 'DMC', 'DC', 'ISI', 'BUI', 'FWI', 'DSR', 'Nivel de Peligro'
        ])

        for item in queryset:
            w = item.weather_data
            writer.writerow([
                item.zone.name, item.zone.latitude, item.zone.longitude, item.date,
                w.temperature if w else '', w.relative_humidity if w else '', w.wind_speed if w else '', w.rain_24h if w else '',
                item.ffmc, item.dmc, item.dc, item.isi, item.bui, item.fwi, item.dsr, item.get_danger_level_display()
            ])

        return response
