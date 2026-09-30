import math

# Day length factors for DMC and DC by month (1-indexed, January = 1)
# Northern Hemisphere standard values (Van Wagner 1987)
DMC_DAY_LENGTH_NORTH = [6.5, 7.5, 9.0, 12.8, 13.9, 13.9, 12.4, 10.9, 9.4, 8.0, 7.0, 6.0]
DC_DAY_LENGTH_NORTH = [-1.6, -1.6, -1.6, 0.9, 3.8, 5.8, 6.4, 5.0, 2.4, 0.4, -1.6, -1.6]

# Southern Hemisphere values (6-month seasonal shift)
DMC_DAY_LENGTH_SOUTH = DMC_DAY_LENGTH_NORTH[6:] + DMC_DAY_LENGTH_NORTH[:6]
DC_DAY_LENGTH_SOUTH = DC_DAY_LENGTH_NORTH[6:] + DC_DAY_LENGTH_NORTH[:6]


def calc_ffmc(temp: float, rh: float, wind: float, rain: float, ffmc_prev: float) -> float:
    """Calculates Fine Fuel Moisture Code (FFMC)."""
    m0 = 147.2 * (101.0 - ffmc_prev) / (59.5 + ffmc_prev)

    if rain > 0.5:
        rf = rain - 0.5
        if m0 <= 150.0:
            mr = m0 + 42.5 * rf * math.exp(-100.0 / (251.0 - m0)) * (1.0 - math.exp(-6.93 / rf))
        else:
            mr = m0 + 42.5 * rf * math.exp(-100.0 / (251.0 - m0)) * (1.0 - math.exp(-6.93 / rf)) + 0.0015 * ((m0 - 150.0) ** 2) * math.sqrt(rf)
        if mr > 250.0:
            mr = 250.0
        m0 = mr

    ed = 0.942 * (rh ** 0.679) + 11.0 * math.exp((rh - 100.0) / 10.0) + 0.18 * (21.1 - temp) * (1.0 - math.exp(-0.115 * rh))

    if m0 < ed:
        ew = 0.618 * (rh ** 0.753) + 10.0 * math.exp((rh - 100.0) / 10.0) + 0.18 * (21.1 - temp) * (1.0 - math.exp(-0.115 * rh))
        if m0 < ew:
            kl = 0.424 * (1.0 - ((rh / 100.0) ** 1.7)) + 0.0694 * math.sqrt(wind) * (1.0 - ((rh / 100.0) ** 8))
            kw = kl * 0.581 * math.exp(0.0365 * temp)
            m = ew - (ew - m0) * (10.0 ** (-kw))
        else:
            m = m0
    else:
        kd_base = 0.424 * (1.0 - (((100.0 - rh) / 100.0) ** 1.7)) + 0.0694 * math.sqrt(wind) * (1.0 - (((100.0 - rh) / 100.0) ** 8))
        kd = kd_base * 0.581 * math.exp(0.0365 * temp)
        m = ed + (m0 - ed) * (10.0 ** (-kd))

    ffmc = 59.5 * (250.0 - m) / (147.2 + m)
    return max(0.0, min(101.0, round(ffmc, 2)))


def calc_dmc(temp: float, rh: float, rain: float, month: int, dmc_prev: float, latitude: float = 0.0) -> float:
    """Calculates Duff Moisture Code (DMC) with rain reduction and hemisphere adjustments."""
    dmc = dmc_prev

    # Rainfall effect: Rain reduces DMC
    if rain > 1.5:
        re = 0.92 * rain - 1.27
        if dmc_prev <= 33.0:
            b = 100.0 / (0.5 + 0.3 * dmc_prev)
        elif dmc_prev <= 65.0:
            b = 14.0 + 1.3 * math.log(max(1.0, dmc_prev))
        else:
            b = 6.2 + 3.4 * math.log(max(1.0, dmc_prev))
        
        # Subtraction: rain DECREASES dmc
        dmc_ra = dmc_prev - (100.0 * re) / (b + 0.38 * re)
        dmc = max(0.0, dmc_ra)

    # Temperature and day length drying factor
    if temp > -1.1:
        le_table = DMC_DAY_LENGTH_SOUTH if latitude < 0 else DMC_DAY_LENGTH_NORTH
        le = le_table[month - 1]
        rk = 1.894 * (temp + 1.1) * (100.0 - rh) * le * 1e-6
        dmc = dmc + 100.0 * rk

    return max(0.0, round(dmc, 2))


def calc_dc(temp: float, rain: float, month: int, dc_prev: float, latitude: float = 0.0) -> float:
    """Calculates Drought Code (DC) with rain reduction and hemisphere adjustments."""
    dc = dc_prev

    # Rainfall effect: Rain reduces DC
    if rain > 2.8:
        rd = 0.83 * rain - 1.27
        q0 = 800.0 * math.exp(-dc_prev / 400.0)
        qr = q0 + 3.937 * rd
        dc_ra = 400.0 * math.log(800.0 / max(1.0, qr))
        dc = max(0.0, dc_ra)

    # Drying factor
    if temp > -2.8:
        lf_table = DC_DAY_LENGTH_SOUTH if latitude < 0 else DC_DAY_LENGTH_NORTH
        lf = lf_table[month - 1]
        v = 0.36 * (temp + 2.8) + lf
        if v > 0:
            dc = dc + 0.5 * v

    return max(0.0, round(dc, 2))


def calc_isi(wind: float, ffmc: float) -> float:
    """Calculates Initial Spread Index (ISI)."""
    fw = math.exp(0.05039 * wind)
    m = 147.2 * (101.0 - ffmc) / (59.5 + ffmc)
    ff = 91.9 * math.exp(-0.1386 * m) * (1.0 + (m ** 5.31) / 4.93e7)
    isi = 0.208 * fw * ff
    return round(isi, 2)


def calc_bui(dmc: float, dc: float) -> float:
    """Calculates Buildup Index (BUI)."""
    if dmc <= 0:
        return 0.0
    if dc <= 0:
        return round(dmc, 2)

    if dmc <= 0.4 * dc:
        bui = (0.8 * dmc * dc) / (dmc + 0.4 * dc)
    else:
        p = (dmc - (1.0 - (0.8 * dc) / (dmc + 0.4 * dc)) * (0.92 + ((0.0114 * dmc) ** 1.7)))
        bui = max(dmc, p)

    return max(0.0, round(bui, 2))


def calc_fwi(isi: float, bui: float) -> float:
    """Calculates Fire Weather Index (FWI)."""
    if bui <= 80.0:
        fd = 0.626 * (bui ** 0.809) + 2.0
    else:
        fd = 1000.0 / (25.0 + 108.64 * math.exp(-0.023 * bui))

    bb = 0.1 * isi * fd

    if bb > 1.0:
        fwi = math.exp(2.72 + 0.434 * math.log(bb) ** 0.647)
    else:
        fwi = bb

    return max(0.0, round(fwi, 2))


def calc_dsr(fwi: float) -> float:
    """Calculates Daily Severity Rating (DSR)."""
    dsr = 0.0272 * (fwi ** 1.77)
    return round(dsr, 2)


def get_danger_level(fwi: float) -> str:
    """
    Returns danger level classification based on regional scale (Córdoba, Argentina CFFDRS adaptation):
    0 - 5.9: LOW (Bajo)
    6 - 14.9: MODERATE (Moderado)
    15 - 27.9: HIGH (Alto)
    28 - 45.9: VERY_HIGH (Muy Alto)
    >= 46: EXTREME (Extremo)
    """
    if fwi < 6.0:
        return 'LOW'
    elif fwi < 15.0:
        return 'MODERATE'
    elif fwi < 28.0:
        return 'HIGH'
    elif fwi < 46.0:
        return 'VERY_HIGH'
    else:
        return 'EXTREME'


def compute_fwi_record(temp: float, rh: float, wind: float, rain: float, month: int,
                       ffmc_prev: float = 85.0, dmc_prev: float = 6.0, dc_prev: float = 15.0,
                       latitude: float = 0.0) -> dict:
    """
    Computes all standard FWI components given daily weather parameters and previous day moisture codes.
    """
    ffmc = calc_ffmc(temp, rh, wind, rain, ffmc_prev)
    dmc = calc_dmc(temp, rh, rain, month, dmc_prev, latitude=latitude)
    dc = calc_dc(temp, rain, month, dc_prev, latitude=latitude)
    isi = calc_isi(wind, ffmc)
    bui = calc_bui(dmc, dc)
    fwi = calc_fwi(isi, bui)
    dsr = calc_dsr(fwi)
    danger_level = get_danger_level(fwi)

    return {
        'ffmc': ffmc,
        'dmc': dmc,
        'dc': dc,
        'isi': isi,
        'bui': bui,
        'fwi': fwi,
        'dsr': dsr,
        'danger_level': danger_level
    }
