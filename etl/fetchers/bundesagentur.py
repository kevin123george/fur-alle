import json
import logging
import re
import time
from decimal import Decimal
from uuid import uuid4

import httpx

from fetchers.base import BaseFetcher, DataSourceError
from models.schemas import EmploymentRaw

logger = logging.getLogger(__name__)

CONFIG_URL = (
    "https://statistik.arbeitsagentur.de/Auswahl/Layout/Statistiktabellen/"
    "JS/DR-LZR-persistListenfelderJSON.js"
)
DIA_URL = (
    "https://statistik-dr.arbeitsagentur.de/bifrontend/bids-api/pc/v1/"
    "tableFetch/dia/EckwerteTabelleALOKr"
)
REQUEST_DELAY = 0.25  # seconds between Kreis requests


def _parse_kreis_config(js_text: str) -> list[dict]:
    """Parse the BA config JS file and return the 401-item Kreis list."""
    # Strip JS variable assignment — the rest is valid JSON
    text = re.sub(r"^var\s+persistListenfelderJSON\s*=\s*", "", js_text.strip())
    text = text.rstrip().rstrip(";")

    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise DataSourceError(f"BA config JS is not valid JSON: {e}")

    # Find the list where Filtername == 'Kreis' (there are two; pick the first)
    for v in data.values():
        if (
            isinstance(v, list)
            and len(v) > 0
            and isinstance(v[0], dict)
            and v[0].get("formValues", {}).get("Filtername") == "Kreis"
        ):
            logger.info("BA: found Kreis list with %d entries", len(v))
            return v

    raise DataSourceError("Could not find Kreis list in BA config JS")


class BundesagenturFetcher(BaseFetcher):
    def __init__(self):
        self._kreis_list: list[dict] | None = None

    def _load_kreis_list(self, client: httpx.Client) -> list[dict]:
        if self._kreis_list is not None:
            return self._kreis_list
        resp = client.get(CONFIG_URL, timeout=30)
        resp.raise_for_status()
        self._kreis_list = _parse_kreis_config(resp.text)
        return self._kreis_list

    def _fetch_one_kreis(self, client: httpx.Client, kreis: dict, batch_id) -> EmploymentRaw | None:
        fv = kreis.get("formValues", {})
        ba_schl = str(fv.get("BA_SCHL", ""))
        ags = ba_schl[:5]          # first 5 digits of BA_SCHL = AGS
        desc = fv.get("DESC", "")  # human name used as API query param

        try:
            resp = client.get(DIA_URL, params={"Kreis": desc}, timeout=30)
            resp.raise_for_status()
            items = resp.json()
        except Exception as exc:
            logger.warning("BA: failed for %s (%s): %s", ags, desc, exc)
            return None

        # index == 0 → most recent month; pick Arbeitslosenquote and Arbeitslose
        unemployment_rate: Decimal | None = None
        unemployed: int | None = None
        data_date = ""

        for item in items:
            if item.get("index") != 0:
                continue
            metric = item.get("metricName", "")
            val = item.get("value")
            if metric == "Arbeitslosenquote" and val is not None:
                unemployment_rate = Decimal(str(val))
                data_date = item.get("attributes", {}).get("0", {}).get("DESC", "")
            elif metric == "Arbeitslose" and val is not None:
                try:
                    unemployed = int(val)
                except (TypeError, ValueError):
                    pass

        return EmploymentRaw(
            batch_id=batch_id,
            ags=ags,
            district_name=desc,
            unemployment_rate=unemployment_rate,
            unemployed=unemployed,
            data_date=data_date,
        )

    def fetch(self) -> list[EmploymentRaw]:
        batch_id = uuid4()
        rows: list[EmploymentRaw] = []

        with httpx.Client(timeout=30) as client:
            kreise = self._load_kreis_list(client)
            logger.info("BA: fetching %d Kreise (~%ds)", len(kreise), int(len(kreise) * REQUEST_DELAY))

            for i, kreis in enumerate(kreise):
                row = self._fetch_one_kreis(client, kreis, batch_id)
                if row is not None:
                    rows.append(row)
                if i > 0 and i % 100 == 0:
                    logger.info("BA: %d/%d Kreise done", i, len(kreise))
                time.sleep(REQUEST_DELAY)

        logger.info("BA: fetched %d employment rows", len(rows))
        return rows

    def health_check(self) -> bool:
        try:
            with httpx.Client(timeout=10) as client:
                return client.get(CONFIG_URL).status_code == 200
        except Exception:
            return False
