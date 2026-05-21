"""Fetch open job vacancies by Kreis from Bundesagentur für Arbeit DIA API.

Reuses the same CONFIG_URL, DIA_URL, and Kreis-list parsing logic as the
employment fetcher.  Fetches three metrics per Kreis:
  - StellenInstitution  → offene_stellen
  - GemeldeteStellen    → gemeldete_stellen
  - Vakanzzeit          → vakanzzeit (average vacancy duration in days)

Attribution: Quelle: Statistik der Bundesagentur für Arbeit
License:     Datenlizenz Deutschland – Namensnennung – Version 2.0
"""
import logging
import time
from uuid import uuid4

import httpx

from fetchers.base import BaseFetcher, DataSourceError
from fetchers.bundesagentur import CONFIG_URL, DIA_URL, _parse_kreis_config
from models.schemas import VacanciesRaw

logger = logging.getLogger(__name__)

REQUEST_DELAY = 0.25

METRIC_OFFENE     = "StellenInstitution"
METRIC_GEMELDET   = "GemeldeteStellen"
METRIC_VAKANZZEIT = "Vakanzzeit"

TARGET_METRICS = {METRIC_OFFENE, METRIC_GEMELDET, METRIC_VAKANZZEIT}


class VacanciesFetcher(BaseFetcher):
    def __init__(self) -> None:
        self._kreis_list: list[dict] | None = None

    def _load_kreis_list(self, client: httpx.Client) -> list[dict]:
        if self._kreis_list is not None:
            return self._kreis_list
        resp = client.get(CONFIG_URL, timeout=30)
        resp.raise_for_status()
        self._kreis_list = _parse_kreis_config(resp.text)
        return self._kreis_list

    def _fetch_one_kreis(
        self, client: httpx.Client, kreis: dict, batch_id
    ) -> VacanciesRaw | None:
        fv = kreis.get("formValues", {})
        ba_schl = str(fv.get("BA_SCHL", ""))
        ags = ba_schl[:5]
        desc = fv.get("DESC", "")

        try:
            resp = client.get(DIA_URL, params={"Kreis": desc}, timeout=30)
            resp.raise_for_status()
            items: list[dict] = resp.json()
        except Exception as exc:
            logger.warning("Vacancies: failed for %s (%s): %s", ags, desc, exc)
            return None

        open_positions: int | None = None
        reported_positions: int | None = None
        avg_vacancy_days: int | None = None
        data_date = ""

        for item in items:
            if item.get("index") != 0:
                continue
            metric = item.get("metricName", "")
            val = item.get("value")

            if metric not in TARGET_METRICS:
                continue

            if not data_date:
                data_date = item.get("attributes", {}).get("0", {}).get("DESC", "")

            if val is None:
                continue

            try:
                int_val = int(round(float(str(val))))
            except (TypeError, ValueError):
                continue

            if metric == METRIC_OFFENE:
                open_positions = int_val
            elif metric == METRIC_GEMELDET:
                reported_positions = int_val
            elif metric == METRIC_VAKANZZEIT:
                avg_vacancy_days = int_val

        return VacanciesRaw(
            batch_id=batch_id,
            ags=ags,
            district_name=desc,
            open_positions=open_positions,
            reported_positions=reported_positions,
            avg_vacancy_days=avg_vacancy_days,
            data_date=data_date,
        )

    def fetch(self) -> list[VacanciesRaw]:
        batch_id = uuid4()
        rows: list[VacanciesRaw] = []

        with httpx.Client(timeout=30) as client:
            try:
                kreise = self._load_kreis_list(client)
            except DataSourceError as exc:
                logger.error("Vacancies: could not load Kreis list: %s", exc)
                return []

            logger.info(
                "Vacancies: fetching %d Kreise (~%ds)",
                len(kreise),
                int(len(kreise) * REQUEST_DELAY),
            )

            for i, kreis in enumerate(kreise):
                row = self._fetch_one_kreis(client, kreis, batch_id)
                if row is not None:
                    rows.append(row)
                if i > 0 and i % 100 == 0:
                    logger.info("Vacancies: %d/%d Kreise done", i, len(kreise))
                time.sleep(REQUEST_DELAY)

        logger.info("Vacancies: fetched %d vacancy rows", len(rows))
        return rows

    def health_check(self) -> bool:
        try:
            with httpx.Client(timeout=10) as client:
                return client.get(CONFIG_URL).status_code == 200
        except Exception:
            return False


def run() -> None:
    """Entry point called by scheduler and run_once.py."""
    from db.writer import write_vacancies_batch

    logger.info("=== BA vacancies fetch ===")
    fetcher = VacanciesFetcher()
    rows = fetcher.fetch()
    logger.info("Vacancies: writing %d rows to DB", len(rows))
    write_vacancies_batch(rows)
