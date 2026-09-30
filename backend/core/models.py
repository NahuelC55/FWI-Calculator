from django.db import models

class Zone(models.Model):
    name = models.CharField(max_length=100, unique=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    country = models.CharField(max_length=100, blank=True, default='')
    region = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.latitude}, {self.longitude})"


class ScrapedWeatherData(models.Model):
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='weather_data')
    date = models.DateField()
    temperature = models.FloatField(help_text="Temperatura en °C a las 12:00 hs")
    relative_humidity = models.FloatField(help_text="Humedad relativa en % a las 12:00 hs")
    wind_speed = models.FloatField(help_text="Velocidad del viento a 10m en km/h a las 12:00 hs")
    rain_24h = models.FloatField(help_text="Lluvia acumulada en 24h en mm")
    scraped_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('zone', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"Clima {self.zone.name} - {self.date}: {self.temperature}°C, {self.relative_humidity}%, {self.wind_speed}km/h, {self.rain_24h}mm"


class FWICalculation(models.Model):
    DANGER_LEVEL_CHOICES = [
        ('LOW', 'Bajo'),
        ('MODERATE', 'Moderado'),
        ('HIGH', 'Alto'),
        ('VERY_HIGH', 'Muy Alto'),
        ('EXTREME', 'Extremo'),
    ]

    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='fwi_calculations')
    date = models.DateField()
    weather_data = models.OneToOneField(ScrapedWeatherData, on_delete=models.CASCADE, null=True, blank=True, related_name='fwi_result')
    
    # Standard FWI Components
    ffmc = models.FloatField(help_text="Fine Fuel Moisture Code")
    dmc = models.FloatField(help_text="Duff Moisture Code")
    dc = models.FloatField(help_text="Drought Code")
    isi = models.FloatField(help_text="Initial Spread Index")
    bui = models.FloatField(help_text="Buildup Index")
    fwi = models.FloatField(help_text="Fire Weather Index")
    dsr = models.FloatField(help_text="Daily Severity Rating")
    
    danger_level = models.CharField(max_length=20, choices=DANGER_LEVEL_CHOICES, default='LOW')
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('zone', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"FWI {self.zone.name} - {self.date}: FWI={self.fwi} ({self.get_danger_level_display()})"


class ScraperLog(models.Model):
    STATUS_CHOICES = [
        ('SUCCESS', 'Éxito'),
        ('ERROR', 'Error'),
        ('RUNNING', 'En ejecución'),
    ]

    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='scraper_logs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUCCESS')
    source = models.CharField(max_length=100, default='Open-Meteo Meteorological Service')
    records_created = models.IntegerField(default=0)
    message = models.TextField(blank=True, default='')
    executed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-executed_at']

    def __str__(self):
        return f"Scraper Log [{self.status}] - {self.executed_at.strftime('%Y-%m-%d %H:%M:%S')}"
