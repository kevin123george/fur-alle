"""Fetch population / demographics by Kreis from the Destatis Kreisverzeichnis.

Source: Destatis 04-kreise.xlsx — quarterly Kreisverzeichnis (no auth required)
URL:    https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/
        Gemeindeverzeichnis/Administrativ/04-kreise.xlsx
Fields: Schlüsselnummer (AGS), Kreis name, Einwohner, Fläche km², Einwohner je km²

Cached for 90 days (data updates quarterly anyway).

Attribution: Quelle: Statistisches Bundesamt (Destatis)
License:     Datenlizenz Deutschland – Namensnennung – Version 2.0
"""
import logging
import os
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation
from io import BytesIO
from pathlib import Path

import httpx
import openpyxl

from fetchers.base import BaseFetcher, DataSourceError
from models.schemas import DemographicsRaw

logger = logging.getLogger(__name__)

KREISVERZEICHNIS_URL = (
    "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/"
    "Gemeindeverzeichnis/Administrativ/04-kreise.xlsx?__blob=publicationFile"
)
CACHE_DIR = Path(__file__).parent.parent.parent / "data" / "raw" / "zensus"
CACHE_MAX_AGE_DAYS = 90


def _cache_path() -> Path:
    return CACHE_DIR / f"{date.today().isoformat()}.xlsx"


def _find_fresh_cache() -> Path | None:
    os.makedirs(CACHE_DIR, exist_ok=True)
    cutoff = date.today() - timedelta(days=CACHE_MAX_AGE_DAYS)
    candidates = []
    for p in CACHE_DIR.glob("*.xlsx"):
        try:
            d = date.fromisoformat(p.stem)
            if d >= cutoff:
                candidates.append((d, p))
        except ValueError:
            pass
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]


def _to_int(val: object) -> int | None:
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return int(val)
    try:
        return int(str(val).strip().replace(".", "").replace(",", ""))
    except (ValueError, TypeError):
        return None


def _to_decimal(val: object) -> Decimal | None:
    if val is None:
        return None
    if isinstance(val, (int, float)):
        try:
            return Decimal(str(val))
        except InvalidOperation:
            return None
    try:
        return Decimal(str(val).strip().replace(".", "").replace(",", "."))
    except (InvalidOperation, ValueError):
        return None


def _parse_xlsx(data: bytes) -> list[DemographicsRaw]:
    """Parse Destatis 04-kreise.xlsx.

    Fixed layout (confirmed from live file):
      Sheet index 1: 'Kreisfreie Städte u. Landkreise'
      Row 1:  title string (contains reference date e.g. '31.12.2024')
      Row 2:  column headers
      Row 3+: data — col 0 = AGS (5-char = Kreis, 2-char = Land aggregate → skip)
                      col 1 = Kreistyp label (skip)
                      col 2 = Kreisname
                      col 4 = Fläche km²
                      col 5 = Einwohner insgesamt (Zensus 2022 basis)
                      col 8 = Einwohner je km² (Dichte)
    """
    wb = openpyxl.load_workbook(BytesIO(data), read_only=True, data_only=True)
    # The data is on the second sheet
    ws = wb.worksheets[1] if len(wb.worksheets) > 1 else wb.active
    rows: list[DemographicsRaw] = []

    ref_date = date.today().replace(month=12, day=31)

    for i, row in enumerate(ws.iter_rows(values_only=True)):
        # Row 0 (index) = title — extract year if present
        if i == 0:
            title = str(row[0] or "")
            import re
            m = re.search(r'31\.12\.(\d{4})', title)
            if m:
                ref_date = date(int(m.group(1)), 12, 31)
            continue
        # Row 1 = headers, skip
        if i == 1:
            continue

        if not row or row[0] is None:
            continue

        ags_raw = str(row[0]).strip()
        # Skip Land aggregates (2-char codes) and summary rows without a 5-char AGS
        if not ags_raw.isdigit() or len(ags_raw) != 5:
            continue

        name = str(row[2]).strip() if row[2] is not None else ags_raw
        area_km2         = _to_decimal(row[4])
        population       = _to_int(row[5])
        population_density = _to_decimal(row[8])

        rows.append(DemographicsRaw(
            ags=ags_raw,
            district_name=name,
            population=population,
            area_km2=area_km2,
            population_density=population_density,
            private_households=None,
            data_date=ref_date,
        ))

    wb.close()
    logger.info("Zensus: parsed %d Kreis rows from xlsx", len(rows))
    return rows


class ZensusFetcher(BaseFetcher):
    def fetch(self) -> list[DemographicsRaw]:
        os.makedirs(CACHE_DIR, exist_ok=True)

        cached = _find_fresh_cache()
        if cached:
            logger.info("Zensus: using cached xlsx from %s", cached)
            try:
                rows = _parse_xlsx(cached.read_bytes())
                if rows:
                    return rows
                logger.warning("Zensus: cached file parsed 0 rows, re-fetching")
            except Exception as exc:
                logger.warning("Zensus: cache parse failed (%s), re-fetching", exc)

        logger.info("Zensus: downloading Kreisverzeichnis from Destatis")
        try:
            with httpx.Client(timeout=60, follow_redirects=True) as client:
                resp = client.get(KREISVERZEICHNIS_URL)
                resp.raise_for_status()
                data = resp.content
        except Exception as exc:
            logger.error("Zensus: download failed: %s", exc)
            raise DataSourceError(f"Zensus download failed: {exc}") from exc

        # Cache the raw xlsx
        cache_file = _cache_path()
        try:
            cache_file.write_bytes(data)
            logger.info("Zensus: cached to %s", cache_file)
        except OSError as exc:
            logger.warning("Zensus: could not write cache: %s", exc)

        rows = _parse_xlsx(data)
        if not rows:
            raise DataSourceError("Zensus: xlsx downloaded but 0 rows parsed — check column layout")
        return rows

    def health_check(self) -> bool:
        try:
            with httpx.Client(timeout=10, follow_redirects=True) as client:
                return client.head(KREISVERZEICHNIS_URL).status_code < 400
        except Exception:
            return False


def run() -> None:
    from db.writer import write_demographics_batch
    logger.info("=== Zensus demographics fetch ===")
    fetcher = ZensusFetcher()
    rows = fetcher.fetch()
    logger.info("Zensus: writing %d rows to DB", len(rows))
    write_demographics_batch(rows)
