"""Fetch and parse Bundestagswahl 2021 results from Bundeswahlleiter open data.

Source: kerg2.csv — semicolon-separated, second-vote (Zweitstimmen) results
by Wahlkreis.  Intended to be run once manually (or annually after each
election), not on a recurring schedule.

Attribution: Quelle: Der Bundeswahlleiter, Wiesbaden
License:     Datenlizenz Deutschland – Namensnennung – Version 2.0
"""
import csv
import io
import json
import logging
import os
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path

import httpx

from fetchers.base import BaseFetcher
from models.schemas import ElectionRow

logger = logging.getLogger(__name__)

# Try 2025 first (most recent election Feb 2025), fall back to 2021
# Domain changed from bundeswahlleiter.de → bundeswahlleiterin.de
BTW_URLS = [
    ("https://www.bundeswahlleiterin.de/dam/jcr/f49a47a1-735b-4e9b-b4e1-4c73cad2292e/btw25_kerg2.csv", 2025, date(2025, 2, 23)),
    ("https://www.bundeswahlleiterin.de/dam/jcr/860495c9-83fb-4068-8a99-c1c985ffffd2/w-btw21_kerg2.csv", 2021, date(2021, 9, 26)),
]

CACHE_DIR = Path(__file__).parent.parent.parent / "data" / "raw" / "btw"
STATIC_DIR = Path(__file__).parent.parent.parent / "data" / "static"
WAHLKREIS_AGS_PATH = STATIC_DIR / "wahlkreis_ags.json"

# Maps the party shorthand as it appears in kerg2.csv GruppenKurzbezeichnung
# column to our canonical field names.
PARTY_FIELD_MAP: dict[str, str] = {
    "SPD":       "spd",
    "CDU":       "cdu_csu",
    "CSU":       "cdu_csu",
    "GRÜNE":     "greens",
    "Grüne":     "greens",
    "GRUNE":     "greens",
    "FDP":       "fdp",
    "AfD":       "afd",
    "DIE LINKE": "left_party",
    "LINKE":     "left_party",
    "Die Linke": "left_party",
}

# Columns in kerg2.csv (exact header names vary slightly between years)
COL_GEBIETSNR   = "Gebietsnummer"
COL_GEBIETSART  = "Gebietsart"
COL_GEBIETSNAME = "Gebietsname"
COL_GRUPPENART  = "Gruppenart"
# 2021 CSV uses "GruppenKurzbezeichnung", 2025 CSV uses "Gruppenname"
COL_GRUPPENNAME_CANDIDATES = ["GruppenKurzbezeichnung", "Gruppenname"]
COL_STIMME      = "Stimme"          # 1 = Erststimme, 2 = Zweitstimme
COL_ANZAHL      = "Anzahl"


def _load_wahlkreis_ags() -> dict[int, list[str]]:
    """Load {wahlkreis_nr: [ags, ...]} from static JSON.

    Creates an empty file if it doesn't exist yet.
    """
    os.makedirs(STATIC_DIR, exist_ok=True)
    if not WAHLKREIS_AGS_PATH.exists():
        logger.warning(
            "Bundestagswahl: wahlkreis_ags.json not found at %s — "
            "creating empty file. Populate manually from Bundeswahlleiter tables.",
            WAHLKREIS_AGS_PATH,
        )
        with open(WAHLKREIS_AGS_PATH, "w") as f:
            json.dump({}, f)
        return {}
    with open(WAHLKREIS_AGS_PATH) as f:
        raw = json.load(f)
    # Keys are stored as strings in JSON; convert to int
    return {int(k): v for k, v in raw.items()}


def _download_csv(client: httpx.Client) -> tuple[str, int, date] | None:
    """Try each URL in BTW_URLS in order; return (text, election_year, data_date) for first success."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    for url, election_year, data_date in BTW_URLS:
        logger.info("Bundestagswahl: trying %s", url)
        try:
            resp = client.get(url, timeout=60, follow_redirects=True)
            if resp.status_code == 404:
                logger.info("Bundestagswahl: %d not found (404), trying next", election_year)
                continue
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            logger.warning("Bundestagswahl: HTTP %s for year %d", exc.response.status_code, election_year)
            continue
        except Exception as exc:
            logger.warning("Bundestagswahl: download failed for year %d: %s", election_year, exc)
            continue

        cache_file = CACHE_DIR / f"{election_year}-{date.today().isoformat()}.csv"
        try:
            cache_file.write_bytes(resp.content)
            logger.info("Bundestagswahl: cached CSV to %s", cache_file)
        except OSError as exc:
            logger.warning("Bundestagswahl: could not write cache: %s", exc)

        try:
            return resp.content.decode("utf-8-sig"), election_year, data_date
        except UnicodeDecodeError:
            return resp.content.decode("latin-1"), election_year, data_date

    return None


def _parse_csv(text: str, election_year: int, data_date: date) -> list[ElectionRow]:
    """Parse kerg2.csv into ElectionRow objects.

    The file has comment lines starting with '#' before the actual header.
    We skip those and find the real header row.
    """
    lines = text.splitlines()

    # Strip comment / metadata lines and find the real header
    header_idx: int | None = None
    for i, line in enumerate(lines):
        if line.startswith("#"):
            continue
        # The real header contains "Gebietsnummer" or "Gebietsart"
        if "Gebietsnummer" in line or "Gebietsart" in line:
            header_idx = i
            break

    if header_idx is None:
        logger.error("Bundestagswahl: could not find header row in kerg2.csv. First 5 lines: %s", lines[:5])
        return []

    csv_text = "\n".join(lines[header_idx:])
    reader = csv.DictReader(io.StringIO(csv_text), delimiter=";")

    fieldnames = reader.fieldnames or []
    logger.info("Bundestagswahl: CSV columns: %s", fieldnames)

    # Detect which column holds the short party name (varies between years)
    col_gruppenname = next(
        (c for c in COL_GRUPPENNAME_CANDIDATES if c in fieldnames),
        COL_GRUPPENNAME_CANDIDATES[0],
    )
    logger.info("Bundestagswahl: using party name column: %s", col_gruppenname)

    # Accumulate Zweitstimmen per Wahlkreis
    wahlkreise: dict[int, dict] = {}

    for row in reader:
        gebietsart = row.get(COL_GEBIETSART, "").strip()
        if gebietsart != "Wahlkreis":
            continue

        stimme_raw = row.get(COL_STIMME, "").strip()
        if stimme_raw != "2":  # Only Zweitstimmen
            continue

        try:
            nr = int(row.get(COL_GEBIETSNR, "0").strip())
        except ValueError:
            continue

        name = row.get(COL_GEBIETSNAME, "").strip()
        gruppenart = row.get(COL_GRUPPENART, "").strip()
        gruppenname = row.get(col_gruppenname, "").strip()

        # Skip aggregate rows (Gruppenart == "System" etc.)
        if gruppenart not in ("Partei", "Wählergruppe", ""):
            # Also pick up wahlbeteiligung from the special row
            if gruppenart == "System" and "Wahlberechtigte" not in gruppenname and "Wähler" in gruppenname:
                pass  # handled below
            else:
                # Still init Wahlkreis entry if first time seeing this nr
                if nr not in wahlkreise:
                    wahlkreise[nr] = {"name": name, "parties": {}, "gueltig": None, "waehler": None, "wahlber": None}
                # Pick up Gültige/Wähler/Wahlberechtigte counts
                if "Gültige" in gruppenname or "gultige" in gruppenname.lower():
                    try:
                        val_raw = row.get(COL_ANZAHL, "").strip().replace(".", "").replace(",", ".")
                        wahlkreise[nr]["gueltig"] = Decimal(val_raw) if val_raw else None
                    except InvalidOperation:
                        pass
                elif "Wähler" in gruppenname and "berechtigte" not in gruppenname:
                    try:
                        val_raw = row.get(COL_ANZAHL, "").strip().replace(".", "").replace(",", ".")
                        wahlkreise[nr]["waehler"] = Decimal(val_raw) if val_raw else None
                    except InvalidOperation:
                        pass
                continue

        if nr not in wahlkreise:
            wahlkreise[nr] = {"name": name, "parties": {}, "gueltig": None, "waehler": None, "wahlber": None}

        field = PARTY_FIELD_MAP.get(gruppenname)
        if field is None:
            continue  # Not a party we track (goes into Sonstige)

        anzahl_raw = row.get(COL_ANZAHL, "").strip().replace(".", "").replace(",", ".")
        try:
            anzahl = Decimal(anzahl_raw) if anzahl_raw else Decimal("0")
        except InvalidOperation:
            anzahl = Decimal("0")

        # CDU and CSU both map to cdu_csu — sum them
        existing = wahlkreise[nr]["parties"].get(field, Decimal("0"))
        wahlkreise[nr]["parties"][field] = existing + anzahl

    logger.info("Bundestagswahl: parsed data for %d Wahlkreise", len(wahlkreise))

    rows: list[ElectionRow] = []
    for nr, wk in wahlkreise.items():
        parties = wk["parties"]
        gueltig = wk["gueltig"]
        waehler = wk["waehler"]

        def pct(votes: Decimal | None, total: Decimal | None) -> Decimal | None:
            if votes is None or total is None or total == 0:
                return None
            return round(votes / total * 100, 2)

        spd        = pct(parties.get("spd"),        gueltig)
        cdu_csu    = pct(parties.get("cdu_csu"),    gueltig)
        greens     = pct(parties.get("greens"),     gueltig)
        fdp        = pct(parties.get("fdp"),        gueltig)
        afd        = pct(parties.get("afd"),        gueltig)
        left_party = pct(parties.get("left_party"), gueltig)

        known_votes = sum(
            (parties.get(f) or Decimal("0"))
            for f in ("spd", "cdu_csu", "greens", "fdp", "afd", "left_party")
        )
        if gueltig and gueltig > 0:
            other = round(max(Decimal("0"), (gueltig - known_votes) / gueltig * 100), 2)
        else:
            other = None

        # Wahlbeteiligung
        turnout: Decimal | None = None
        if waehler and wk.get("wahlber") and wk["wahlber"] > 0:
            turnout = round(waehler / wk["wahlber"] * 100, 2)

        rows.append(ElectionRow(
            constituency_nr=nr,
            constituency_name=wk["name"],
            election_year=election_year,
            turnout=turnout,
            spd=spd,
            cdu_csu=cdu_csu,
            greens=greens,
            fdp=fdp,
            afd=afd,
            left_party=left_party,
            other=other,
            data_date=data_date,
        ))

    return rows


class BundestagswahFetcher(BaseFetcher):
    def fetch(self) -> list[ElectionRow]:
        try:
            with httpx.Client(timeout=60) as client:
                result = _download_csv(client)
        except Exception as exc:
            logger.error("Bundestagswahl: fetch failed: %s", exc)
            return []

        if result is None:
            logger.error("Bundestagswahl: all URLs failed")
            return []

        csv_text, election_year, data_date = result
        return _parse_csv(csv_text, election_year, data_date)

    def health_check(self) -> bool:
        try:
            with httpx.Client(timeout=15) as client:
                url = BTW_URLS[0][0]
                resp = client.head(url, follow_redirects=True, timeout=15)
                return resp.status_code in (200, 302, 301)
        except Exception:
            return False


def run() -> None:
    """Entry point called by run_once.py (no scheduler job — run manually)."""
    from db.writer import write_election_batch

    logger.info("=== Bundestagswahl fetch ===")
    ags_map = _load_wahlkreis_ags()
    fetcher = BundestagswahFetcher()
    rows = fetcher.fetch()
    logger.info("Bundestagswahl: writing %d rows to DB", len(rows))
    write_election_batch(rows, ags_map)
