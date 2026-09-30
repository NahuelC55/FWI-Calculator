import os
import sys

# Setup path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.fwi_engine import compute_fwi_record, get_danger_level

def run_tests():
    print("=== Ejecutando pruebas unitarias de validación matemática FWI ===")
    
    # Test case 1: Dry warm day with strong wind
    res1 = compute_fwi_record(temp=32.0, rh=18.0, wind=35.0, rain=0.0, month=7, ffmc_prev=88.0, dmc_prev=45.0, dc_prev=220.0)
    print(f"Test 1 (Día Seco & Cálido): FWI={res1['fwi']}, FFMC={res1['ffmc']}, DMC={res1['dmc']}, DC={res1['dc']}, ISI={res1['isi']}, BUI={res1['bui']}, Nivel={res1['danger_level']}")
    assert res1['fwi'] > 20.0, "Fallo: FWI debería indicar riesgo alto/extremo"
    assert res1['danger_level'] in ['HIGH', 'VERY_HIGH', 'EXTREME']

    # Test case 2: Rainy day
    res2 = compute_fwi_record(temp=12.0, rh=90.0, wind=10.0, rain=25.0, month=5, ffmc_prev=res1['ffmc'], dmc_prev=res1['dmc'], dc_prev=res1['dc'])
    print(f"Test 2 (Día Lluvioso 25mm): FWI={res2['fwi']}, FFMC={res2['ffmc']}, DMC={res2['dmc']}, DC={res2['dc']}, ISI={res2['isi']}, BUI={res2['bui']}, Nivel={res2['danger_level']}")
    assert res2['fwi'] < res1['fwi'], "Fallo: La lluvia debe reducir sustancialmente el FWI"
    assert res2['isi'] < 1.0, "Fallo: La lluvia debe reducir drásticamente el índice de propagación inicial (ISI)"
    assert res2['ffmc'] < 60.0, "Fallo: La lluvia debe reducir la humedad de combustibles finos (FFMC)"

    print("[OK] Todas las pruebas matematicas FWI superadas con exito!")

if __name__ == '__main__':
    run_tests()
