import json
import logging
import math
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

import httpx

from fetchers.base import BaseFetcher, DataSourceError
from models.schemas import AirQualityRaw

logger = logging.getLogger(__name__)

STATIONS_URL = "https://www.umweltbundesamt.de/api/air_data/v3/stations/json"
AIRQUALITY_URL = "https://www.umweltbundesamt.de/api/air_data/v3/airquality/json"
GEOJSON_PATH = Path(__file__).parent.parent.parent / "data" / "static" / "kreise.geo.json"

# UBA component IDs
COMP_PM10 = "1"
COMP_NO2 = "5"
COMP_O3 = "3"
COMP_PM25 = "9"


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
    return result


def _dist(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Euclidean distance in degree-space — sufficient for finding nearest German station."""
    return math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2)


def _load_active_stations(client: httpx.Client) -> list[dict]:
    """Return list of {id, name, lat, lon} for currently active UBA stations."""
    resp = client.get(STATIONS_URL, params={"lang": "de"}, timeout=30)
    resp.raise_for_status()
    payload = resp.json()
    indices = payload["indices"]
    # Column positions from the indices list
    idx_id = indices.index("station id")
    idx_name = indices.index("station name")
    idx_lon = indices.index("station longitude")
    idx_lat = indices.index("station latitude")
    idx_active_to = indices.index("station active to")

    active = []
    for row in payload["data"].values():
        if row[idx_active_to] is not None:  # inactive stations have an end date
            continue
        try:
            active.append({
                "id": int(row[idx_id]),
                "name": row[idx_name],
                "lat": float(row[idx_lat]),
                "lon": float(row[idx_lon]),
            })
        except (TypeError, ValueError):
            continue

    logger.info("UBA: loaded %d active stations", len(active))
    return active


def _nearest_station(kreis: dict, stations: list[dict]) -> dict:
    return min(stations, key=lambda s: _dist(kreis["lat"], kreis["lon"], s["lat"], s["lon"]))


def _parse_component(entries: list, comp_id: str) -> Decimal | None:
    """Extract value for a given component ID from a measurement entry."""
    for item in entries:
        if isinstance(item, list) and len(item) >= 2 and str(item[0]) == comp_id:
            val = item[1]
            if val is not None:
                try:
                    return Decimal(str(val))
                except Exception:
                    pass
    return None


def _fetch_station_quality(client: httpx.Client, station_id: int) -> tuple[dict | None, datetime | None]:
    """Try up to 3 days back to find air quality data for a station."""
    now = datetime.now(timezone.utc)
    for days_back in range(1, 4):
        target = (now - timedelta(days=days_back)).strftime("%Y-%m-%d")
        try:
            resp = client.get(
                AIRQUALITY_URL,
                params={"station": station_id, "date_from": target, "date_to": target, "lang": "de"},
                timeout=20,
            )
            resp.raise_for_status()
            payload = resp.json()
            station_data = payload.get("data", {}).get(str(station_id), {})
            if not station_data:
                continue

            # Take the most recent timestamp entry
            latest_ts = max(station_data.keys())
            entry = station_data[latest_ts]  # [date_end, total_idx, incomplete, [comp, val, ...], ...]
            measurements = entry[3:]  # component arrays start at index 3

            ts = datetime.fromisoformat(latest_ts.replace(" ", "T")).replace(tzinfo=timezone.utc)
            return {
                "pm10": _parse_component(measurements, COMP_PM10),
                "no2": _parse_component(measurements, COMP_NO2),
                "o3": _parse_component(measurements, COMP_O3),
                "pm25": _parse_component(measurements, COMP_PM25),
            }, ts
        except Exception as exc:
            logger.debug("UBA: failed for station %d on %s: %s", station_id, target, exc)
    return None, None


class UbaFetcher(BaseFetcher):
    def fetch(self) -> list[AirQualityRaw]:
        kreise = _load_kreise()

        with httpx.Client(timeout=30) as client:
            stations = _load_active_stations(client)

        # Map each Kreis to its nearest station
        kreis_station: list[tuple[dict, dict]] = []
        for k in kreise:
            kreis_station.append((k, _nearest_station(k, stations)))

        # Collect unique station IDs to avoid redundant API calls
        unique_stations: dict[int, dict] = {}
        for _, s in kreis_station:
            unique_stations[s["id"]] = s

        logger.info("UBA: fetching data for %d unique stations", len(unique_stations))

        # Fetch air quality for each unique station
        station_results: dict[int, tuple[dict | None, datetime | None]] = {}

        def fetch_one(sid: int):
            with httpx.Client(timeout=30) as client:
                return sid, _fetch_station_quality(client, sid)

        with ThreadPoolExecutor(max_workers=5) as pool:
            futures = {pool.submit(fetch_one, sid): sid for sid in unique_stations}
            for i, future in enumerate(as_completed(futures)):
                sid, result = future.result()
                station_results[sid] = result
                if i > 0 and i % 50 == 0:
                    logger.info("UBA: %d/%d stations done", i, len(unique_stations))

        # Build rows
        rows: list[AirQualityRaw] = []
        for kreis, station in kreis_station:
            data, ts = station_results.get(station["id"], (None, None))
            if data is None or ts is None:
                continue
            if all(v is None for v in data.values()):
                continue
            rows.append(AirQualityRaw(
                ags=kreis["ags"],
                district_name=kreis["name"],
                station_id=station["id"],
                station_name=station["name"],
                pm10=data["pm10"],
                no2=data["no2"],
                o3=data["o3"],
                pm25=data["pm25"],
                data_date=ts,
            ))

        logger.info("UBA: produced %d air quality rows", len(rows))
        return rows

    def health_check(self) -> bool:
        try:
            with httpx.Client(timeout=10) as client:
                return client.get(STATIONS_URL, params={"lang": "de"}).status_code == 200
        except Exception:
            return False
