"""Fetch average fuel prices per Kreis from Tankerkönig open data API.

Source:  https://creativecommons.tankerkoenig.de/
License: CC BY 4.0 — attribution required
Cadence: Every 3 hours (prices change frequently)
Setup:   Register for a free API key at https://creativecommons.tankerkoenig.de/
         Add TANKERKOENIG_API_KEY=<your-key> to etl/.env
"""
import json
import logging
import os
import time
from decimal import Decimal
from pathlib import Path

import httpx

from models.schemas import FuelPriceRaw

logger = logging.getLogger(__name__)

GEOJSON_PATH = Path(__file__).parent.parent.parent / "data" / "static" / "kreise.geo.json"
BASE_URL = "https://creativecommons.tankerkoenig.de/json/list.php"
RADIUS_KM = 100       # large radius — one request covers a whole region
REQUEST_DELAY = 60.0  # 1 req/min — 16 total = ~17 min, well within free tier limits
MAX_RETRIES = 3
RETRY_BACKOFF = 60

# One point per Bundesland — 16 requests cover all of Germany
BUNDESLAND_CENTERS = [
    ("Schleswig-Holstein",       54.219,  9.696),
    ("Hamburg",                  53.550,  9.993),
    ("Mecklenburg-Vorpommern",   53.613, 12.430),
    ("Bremen",                   53.079,  8.801),
    ("Brandenburg",              52.408, 13.040),
    ("Berlin",                   52.520, 13.405),
    ("Niedersachsen",            52.636,  9.845),
    ("Sachsen-Anhalt",           51.951, 11.692),
    ("Sachsen",                  51.105, 13.201),
    ("Thüringen",                51.011, 10.845),
    ("Nordrhein-Westfalen",      51.433,  7.661),
    ("Hessen",                   50.652,  9.163),
    ("Rheinland-Pfalz",          50.118,  7.309),
    ("Saarland",                 49.397,  6.970),
    ("Baden-Württemberg",        48.660,  9.352),
    ("Bayern",                   48.790, 11.498),
]


def _load_kreise() -> list[dict]:
    with open(GEOJSON_PATH) as f:
        geo = json.load(f)
    result = []
    for feat in geo["features"]:
        props = feat["properties"]
        raw_ags = props.get("krs_code")
        ags = raw_ags[0] if isinstance(raw_ags, list) else (raw_ags or "")
        raw_name = props.get("krs_name")
        name = raw_name[0] if isinstance(raw_name, list) else (raw_name or ags)
        pt = props.get("geo_point_2d", {})
        lat = pt.get("lat")
        lon = pt.get("lon")
        if ags and lat is not None and lon is not None:
            result.append({"ags": ags, "name": name, "lat": lat, "lon": lon})
    logger.info("Tankerkoenig: loaded %d Kreise from GeoJSON", len(result))
    return result



def _fetch_region(client: httpx.Client, name: str, lat: float, lon: float, api_key: str) -> list[dict]:
    """Fetch all stations within RADIUS_KM of a regional center."""
    params = {"lat": lat, "lng": lon, "rad": RADIUS_KM, "sort": "dist", "type": "all", "apikey": api_key}
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = client.get(BASE_URL, params=params)
            if resp.status_code == 503:
                logger.warning("503 for %s (attempt %d/%d) — waiting %ds", name, attempt, MAX_RETRIES, RETRY_BACKOFF)
                time.sleep(RETRY_BACKOFF)
                continue
            resp.raise_for_status()
            data = resp.json()
            stations = data.get("stations", [])
            logger.info("Tankerkoenig: %s → %d stations", name, len(stations))
            return stations
        except Exception as exc:
            logger.warning("Tankerkoenig: failed %s (attempt %d): %s", name, attempt, exc)
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_BACKOFF)
    return []


def _nearest_kreis(station: dict, kreise: list[dict]) -> dict | None:
    """Return the Kreis whose center is closest to the station."""
    slat, slon = station.get("lat", 0), station.get("lng", 0)
    best, best_dist = None, float("inf")
    for k in kreise:
        d = (k["lat"] - slat) ** 2 + (k["lon"] - slon) ** 2
        if d < best_dist:
            best_dist, best = d, k
    return best


def run() -> None:
    from db.writer import write_fuel_prices_batch

    api_key = os.getenv("TANKERKOENIG_API_KEY", "")
    if not api_key:
        logger.error(
            "TANKERKOENIG_API_KEY not set — register free at "
            "https://creativecommons.tankerkoenig.de/ and add to etl/.env"
        )
        return

    kreise = _load_kreise()

    # Collect all unique stations across 16 regional queries
    all_stations: dict[str, dict] = {}   # station id → station dict
    with httpx.Client(timeout=30) as client:
        for name, lat, lon in BUNDESLAND_CENTERS:
            stations = _fetch_region(client, name, lat, lon, api_key)
            for s in stations:
                sid = s.get("id")
                if sid and sid not in all_stations:
                    all_stations[sid] = s
            time.sleep(REQUEST_DELAY)

    logger.info("Tankerkoenig: %d unique stations across Germany", len(all_stations))

    # Assign each station to its nearest Kreis
    kreis_stations: dict[str, list[dict]] = {k["ags"]: [] for k in kreise}
    kreis_map = {k["ags"]: k for k in kreise}
    for station in all_stations.values():
        k = _nearest_kreis(station, kreise)
        if k:
            kreis_stations[k["ags"]].append(station)

    # Aggregate per Kreis
    rows: list[FuelPriceRaw] = []
    for kreis in kreise:
        ags = kreis["ags"]
        stations = kreis_stations[ags]
        if not stations:
            continue
        e5s     = [s["e5"]     for s in stations if s.get("e5")     and s["e5"] > 0]
        e10s    = [s["e10"]    for s in stations if s.get("e10")    and s["e10"] > 0]
        diesels = [s["diesel"] for s in stations if s.get("diesel") and s["diesel"] > 0]
        rows.append(FuelPriceRaw(
            ags=ags,
            district_name=kreis["name"],
            e5_avg=Decimal(str(round(sum(e5s) / len(e5s), 3)))            if e5s     else None,
            e10_avg=Decimal(str(round(sum(e10s) / len(e10s), 3)))         if e10s    else None,
            diesel_avg=Decimal(str(round(sum(diesels) / len(diesels), 3))) if diesels else None,
            station_count=len(stations),
        ))

    logger.info("Tankerkoenig: %d Kreise with fuel data", len(rows))
    write_fuel_prices_batch(rows)
