import json
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

import httpx

from fetchers.base import BaseFetcher, DataSourceError
from models.schemas import WeatherRaw

logger = logging.getLogger(__name__)

BASE_URL = "https://api.brightsky.dev/current_weather"
GEOJSON_PATH = Path(__file__).parent.parent.parent / "data" / "static" / "kreise.geo.json"
REQUEST_DELAY = 0.15


def _load_kreise() -> list[dict]:
    """Return list of {ags, name, lat, lon} from the GeoJSON."""
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
    logger.info("Brightsky: loaded %d Kreise from GeoJSON", len(result))
    return result


class BrightskyFetcher(BaseFetcher):
    def _fetch_one(self, kreis: dict) -> WeatherRaw | None:
        try:
            with httpx.Client(timeout=20) as client:
                resp = client.get(BASE_URL, params={"lat": kreis["lat"], "lon": kreis["lon"]})
                resp.raise_for_status()
                w = resp.json().get("weather", {})

            if not w:
                return None

            ts_raw = w.get("timestamp")
            datenstand = (
                datetime.fromisoformat(ts_raw).astimezone(timezone.utc)
                if ts_raw
                else datetime.now(timezone.utc)
            )

            return WeatherRaw(
                ags=kreis["ags"],
                district_name=kreis["name"],
                temperature=Decimal(str(w["temperature"])) if w.get("temperature") is not None else None,
                wind_speed=Decimal(str(w["wind_speed_10"])) if w.get("wind_speed_10") is not None else None,
                precipitation=Decimal(str(w["precipitation_10"])) if w.get("precipitation_10") is not None else None,
                condition=w.get("condition"),
                cloud_cover=w.get("cloud_cover"),
                humidity=w.get("relative_humidity"),
                data_date=datenstand,
            )
        except Exception as exc:
            logger.warning("Brightsky: failed for %s: %s", kreis["ags"], exc)
            return None

    def fetch(self) -> list[WeatherRaw]:
        kreise = _load_kreise()
        rows: list[WeatherRaw] = []

        with ThreadPoolExecutor(max_workers=8) as pool:
            futures = {pool.submit(self._fetch_one, k): k for k in kreise}
            for i, future in enumerate(as_completed(futures)):
                result = future.result()
                if result is not None:
                    rows.append(result)
                if i > 0 and i % 100 == 0:
                    logger.info("Brightsky: %d/%d done", i, len(kreise))
                time.sleep(REQUEST_DELAY / 8)  # spread across threads

        logger.info("Brightsky: fetched weather for %d Kreise", len(rows))
        return rows

    def health_check(self) -> bool:
        try:
            with httpx.Client(timeout=10) as client:
                resp = client.get(BASE_URL, params={"lat": 52.52, "lon": 13.41})
                return resp.status_code == 200
        except Exception:
            return False
