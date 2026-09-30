import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fwi_project.settings')
django.setup()

from core.models import Zone
from core.scraper import run_scraper_for_zone

INITIAL_ZONES = [
    {
        'name': 'Bariloche (Patagonia)',
        'latitude': -41.1335,
        'longitude': -71.3103,
        'country': 'Argentina',
        'region': 'Río Negro',
        'description': 'Región cordillerana con alta presencia de bosques templados y riesgo estival de incendios.'
    },
    {
        'name': 'Valparaíso (Costa Central)',
        'latitude': -33.0472,
        'longitude': -71.6127,
        'country': 'Chile',
        'region': 'Valparaíso',
        'description': 'Zona costera y cerros vulnerables a vientos fuertes e incendios forestales.'
    },
    {
        'name': 'Córdoba (Sierras)',
        'latitude': -31.4201,
        'longitude': -64.1888,
        'country': 'Argentina',
        'region': 'Córdoba',
        'description': 'Zona de pastizales y matorrales serranos con alta frecuencia de incendios en temporada seca.'
    },
    {
        'name': 'Madrid (Sierra de Guadarrama)',
        'latitude': 40.4168,
        'longitude': -3.7038,
        'country': 'España',
        'region': 'Comunidad de Madrid',
        'description': 'Bosques mediterráneos y de pino propensos a estrés hídrico durante el verano.'
    }
]

def seed():
    print("Iniciando sembrado de zonas meteorológicas...")
    for z_data in INITIAL_ZONES:
        zone, created = Zone.objects.get_or_create(
            name=z_data['name'],
            defaults=z_data
        )
        if created:
            print(f"[+] Zona creada: {zone.name}")
        else:
            print(f"[-] Zona ya existente: {zone.name}")

        # Run initial scrape for past 7 days
        print(f"  -> Ejecutando scraper para {zone.name}...")
        res = run_scraper_for_zone(zone)
        print(f"     Resultado: {res['message'] if res.get('success') else res.get('error')}")

    print("\n¡Sembrado y cálculo FWI completado con éxito!")

if __name__ == '__main__':
    seed()
