"""Fetch German CPI (Verbraucherpreisindex) year-over-year % change by category.

Source:  European Central Bank SDMX API — ICP dataset, Germany
License: ECB open data (free, no auth required)
Cadence: Monthly (data available ~4 weeks after reference month)
"""
import logging
import uuid
from datetime import date

import httpx

from models.schemas import CpiRaw

logger = logging.getLogger(__name__)

CATEGORIES = {
    "000000": "Gesamt",
    "010000": "Nahrungsmittel",
    "040000": "Wohnen & Energie",
    "045000": "Strom & Gas",
    "070000": "Verkehr",
}

BASE_URL = "https://data-api.ecb.europa.eu/service/data/ICP/M.DE.N.{code}.4.ANR"


def run() -> None:
    from db.writer import write_cpi_batch
    batch_id = uuid.uuid4()
    rows: list[CpiRaw] = []

    with httpx.Client(timeout=30) as client:
        for code, label in CATEGORIES.items():
            url = BASE_URL.format(code=code)
            resp = client.get(url, params={"format": "jsondata", "startPeriod": "2022-01"})
            resp.raise_for_status()
            data = resp.json()

            structure = data["structure"]
            periods = [v["id"] for v in structure["dimensions"]["observation"][0]["values"]]
            obs = list(data["dataSets"][0]["series"].values())[0]["observations"]

            for idx_str, values in obs.items():
                period = periods[int(idx_str)]
                yoy = values[0]
                if yoy is None:
                    continue
                year, month = period.split("-")
                rows.append(CpiRaw(
                    batch_id=batch_id,
                    category=label,
                    year_month=date(int(year), int(month), 1),
                    yoy_pct=float(yoy),
                ))

            logger.info("CPI: fetched %s (%s) — %d months", label, code, len([r for r in rows if r.category == label]))

    logger.info("CPI: total %d rows across %d categories", len(rows), len(CATEGORIES))
    write_cpi_batch(rows)
