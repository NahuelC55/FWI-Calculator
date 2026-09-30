from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ZoneViewSet, FWICalculationViewSet, ScraperLogViewSet,
    RunScraperAPIView, DashboardSummaryAPIView, ExportFWICSVAPIView
)

router = DefaultRouter()
router.register(r'zones', ZoneViewSet, basename='zone')
router.register(r'fwi-calculations', FWICalculationViewSet, basename='fwi-calculation')
router.register(r'scraper-logs', ScraperLogViewSet, basename='scraper-log')

urlpatterns = [
    path('', include(router.urls)),
    path('scraper/run/', RunScraperAPIView.as_view(), name='scraper-run'),
    path('dashboard/summary/', DashboardSummaryAPIView.as_view(), name='dashboard-summary'),
    path('export/csv/', ExportFWICSVAPIView.as_view(), name='export-csv'),
]
