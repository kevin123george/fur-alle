import json
import logging
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timezone
from pathlib import Path
from uuid import uuid4

import httpx

from fetchers.base import BaseFetcher, DataSourceError
from models.schemas import EnergyRaw, SMARD_FILTER_NAMES

logger = logging.getLogger(__name__)

BASE_URL = "https://www.smard.de/app/chart_data"
FILTER_CODES = list(SMARD_FILTER_NAMES.keys())  # [410, 4068, 4067, 1225, 4066]
REGION = "DE"
RESOLUTION = "quarterhour"


class SmardFetcher(BaseFetcher):
    def __init__(self, raw_data_dir: str | None = None):
        self._raw_dir = Path(raw_data_dir or os.getenv("RAW_DATA_DIR", "../data/raw")) / "smard"
        self._raw_dir.mkdir(parents=True, exist_ok=True)

    def _get_latest_valid_timestamp(self, client: httpx.Client, filter_code: int) -> int:
        url = f"{BASE_URL}/{filter_code}/{REGION}/index_{RESOLUTION}.json"
        resp = client.get(url, timeout=30)
        resp.raise_for_status()
        timestamps: list[int] = resp.json()["timestamps"]
        if not timestamps:
            raise DataSourceError(f"SMARD index empty for filter {filter_code}")
        # Try last few timestamps in descending order — index may include future entries
        for ts in sorted(timestamps, reverse=True)[:5]:
            data_url = f"{BASE_URL}/{filter_code}/{REGION}/{filter_code}_{REGION}_{RESOLUTION}_{ts}.json"
            probe = client.head(data_url, timeout=10)
            if probe.status_code == 200:
                return ts
        raise DataSourceError(f"No valid data file found for filter {filter_code}")

    def _fetch_one_filter(self, filter_code: int, batch_id) -> list[EnergyRaw]:
        with httpx.Client(timeout=30) as client:
            ts = self._get_latest_valid_timestamp(client, filter_code)
            datenstand = datetime.fromtimestamp(ts / 1000, tz=timezone.utc).date()

            url = f"{BASE_URL}/{filter_code}/{REGION}/{filter_code}_{REGION}_{RESOLUTION}_{ts}.json"
            resp = client.get(url, timeout=30)
            resp.raise_for_status()
            payload = resp.json()

            # Cache raw response
            cache_path = self._raw_dir / f"{filter_code}_{datenstand.isoformat()}.json"
            cache_path.write_text(json.dumps(payload, ensure_ascii=False))

        rows: list[EnergyRaw] = []
        for point in payload["series"]:
            ts_ms, mwh = point[0], point[1]
            rows.append(EnergyRaw(
                batch_id=batch_id,
                filter_code=filter_code,
                ts_utc=datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc),
                mwh_quarter=mwh,  # None if null
                data_date=datenstand,
            ))

        logger.info("SMARD filter=%d fetched %d points (datenstand=%s)", filter_code, len(rows), datenstand)
        return rows

    def fetch(self) -> list[EnergyRaw]:
        all_rows: list[EnergyRaw] = []
        errors: list[str] = []
        batch_id = uuid4()

        with ThreadPoolExecutor(max_workers=5) as pool:
            futures = {pool.submit(self._fetch_one_filter, fc, batch_id): fc for fc in FILTER_CODES}
            for future in as_completed(futures):
                fc = futures[future]
                try:
                    all_rows.extend(future.result())
                except Exception as exc:
                    errors.append(f"filter {fc}: {exc}")
                    logger.error("SMARD fetch failed for filter %d: %s", fc, exc)

        if errors and not all_rows:
            raise DataSourceError(f"All SMARD fetches failed: {errors}")
        if errors:
            logger.warning("SMARD partial failure: %s", errors)

        return all_rows

    def health_check(self) -> bool:
        try:
            with httpx.Client(timeout=10) as client:
                url = f"{BASE_URL}/{FILTER_CODES[0]}/{REGION}/index_{RESOLUTION}.json"
                return client.get(url).status_code == 200
        except Exception:
            return False
