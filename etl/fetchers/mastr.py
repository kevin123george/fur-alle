"""Fetch renewable energy installations from Marktstammdatenregister (MaStR).

Uses the Gesamtdatenexport bulk ZIP.  The old OData JSON API
(GetErweiterteOeffentlicheEinheitStromerzeugung) was silently removed in 2025
and now returns {"Errors": "Die Anfrage ist Null."} for every request.

The bulk ZIP is ~2.8 GB.  To avoid downloading it completely we wrap the
remote file in a seekable RangeStream so Python's zipfile module can read the
Central Directory (~1 MB at the end) and then fetch only the compressed bytes
for the individual XML files we care about.  If the server doesn't honour Range
headers we fall back to a full streaming download cached on disk.

Attribution: Quelle: Bundesnetzagentur / Marktstammdatenregister
License:     Datenlizenz Deutschland – Namensnennung – Version 2.0
"""
import io
import logging
import re
import xml.etree.ElementTree as ET
import zipfile
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation
from pathlib import Path

import httpx

from fetchers.base import BaseFetcher
from models.schemas import RenewablesRaw

logger = logging.getLogger(__name__)

DOWNLOAD_PAGE = "https://www.marktstammdatenregister.de/MaStR/Datendownload"
CACHE_DIR = Path(__file__).parent.parent.parent / "data" / "raw" / "mastr"
CACHE_DAYS = 6

# Files inside the ZIP we process: (filename_pattern, unit_element_tag)
# Confirmed from Gesamtdatenexport_20260505_26.1.zip — UTF-16 XML, no namespaces.
FILE_PATTERNS: dict[str, tuple[re.Pattern[str], str]] = {
    "solar":    (re.compile(r"^EinheitenSolar_\d+\.xml$",  re.IGNORECASE), "EinheitSolar"),
    "wind":     (re.compile(r"^EinheitenWind\.xml$",       re.IGNORECASE), "EinheitWind"),
    "biomasse": (re.compile(r"^EinheitenBiomasse\.xml$",   re.IGNORECASE), "EinheitBiomasse"),
}

# XML tag names used in the bulk export
_GEMEINDE_TAG = "Gemeindeschluessel"
_POWER_TAGS   = {"Nettonennleistung", "Bruttoleistung"}


# ---------------------------------------------------------------------------
# Seekable HTTP wrapper
# ---------------------------------------------------------------------------

class _RangeStream(io.RawIOBase):
    """Wraps an HTTP URL as a seekable byte stream using Range requests."""

    def __init__(self, url: str, client: httpx.Client) -> None:
        resp = client.head(url, follow_redirects=True, timeout=30)
        resp.raise_for_status()
        self._url    = url
        self._client = client
        self._size   = int(resp.headers["content-length"])
        self._pos    = 0
        if resp.headers.get("accept-ranges", "").lower() != "bytes":
            raise ValueError("Server does not support byte-range requests")

    def readable(self) -> bool:  return True
    def seekable(self) -> bool:  return True
    def tell(self)     -> int:   return self._pos

    def seek(self, pos: int, whence: int = 0) -> int:
        if   whence == 0: self._pos = pos
        elif whence == 1: self._pos += pos
        elif whence == 2: self._pos = self._size + pos
        self._pos = max(0, min(self._pos, self._size))
        return self._pos

    def readinto(self, b: bytearray) -> int:
        if self._pos >= self._size:
            return 0
        end  = min(self._pos + len(b) - 1, self._size - 1)
        resp = self._client.get(
            self._url,
            headers={"Range": f"bytes={self._pos}-{end}"},
            timeout=120,
            follow_redirects=True,
        )
        data = resp.content
        n    = len(data)
        b[:n] = data
        self._pos += n
        return n


# ---------------------------------------------------------------------------
# URL discovery
# ---------------------------------------------------------------------------

def _discover_zip_url(client: httpx.Client) -> str | None:
    """Scrape the MaStR Datendownload page to find the current bulk ZIP URL."""
    try:
        resp = client.get(DOWNLOAD_PAGE, timeout=30, follow_redirects=True)
        resp.raise_for_status()
        matches = re.findall(
            r"https://download\.marktstammdatenregister\.de/"
            r"Gesamtdatenexport_\d{8}_[\d.]+\.zip",
            resp.text,
        )
        if matches:
            url = matches[-1]
            logger.info("MaStR: discovered bulk ZIP URL: %s", url)
            return url
        logger.warning("MaStR: no ZIP URL found in download page HTML")
    except Exception as exc:
        logger.error("MaStR: could not load download page: %s", exc)
    return None


# ---------------------------------------------------------------------------
# ZIP access helpers
# ---------------------------------------------------------------------------

def _open_zip_range(url: str, client: httpx.Client) -> zipfile.ZipFile | None:
    """Open the remote ZIP via range requests (no full download)."""
    try:
        stream = io.BufferedReader(_RangeStream(url, client), buffer_size=1 << 20)
        zf = zipfile.ZipFile(stream)
        logger.info("MaStR: opened remote ZIP via range requests")
        return zf
    except Exception as exc:
        logger.warning("MaStR: range-request ZIP open failed (%s), will fall back", exc)
        return None


def _find_cached_zip() -> Path | None:
    for p in sorted(CACHE_DIR.glob("Gesamtdatenexport_*.zip"), reverse=True):
        age = date.today() - date.fromisoformat(p.stem.split("_")[1][:8] if "_" in p.stem else "2000-01-01")
        if age <= timedelta(days=CACHE_DAYS):
            return p
    return None


def _download_zip_to_cache(url: str, client: httpx.Client) -> Path | None:
    """Stream-download the full ZIP to CACHE_DIR."""
    filename = url.split("/")[-1]
    dest = CACHE_DIR / filename
    if dest.exists():
        logger.info("MaStR: cache hit — %s", dest)
        return dest
    logger.info("MaStR: downloading bulk ZIP to %s (this may take a while)", dest)
    tmp = dest.with_suffix(".tmp")
    try:
        with client.stream("GET", url, timeout=3600, follow_redirects=True) as resp:
            resp.raise_for_status()
            total = int(resp.headers.get("content-length", 0))
            written = 0
            with open(tmp, "wb") as fh:
                for chunk in resp.iter_bytes(chunk_size=1 << 20):
                    fh.write(chunk)
                    written += len(chunk)
                    if total:
                        pct = written / total * 100
                        if written % (100 << 20) < (1 << 20):
                            logger.info("MaStR: download %.0f%% (%d MB)", pct, written >> 20)
        tmp.rename(dest)
        logger.info("MaStR: download complete — %s", dest)
        return dest
    except Exception as exc:
        logger.error("MaStR: download failed: %s", exc)
        tmp.unlink(missing_ok=True)
        return None


# ---------------------------------------------------------------------------
# XML parsing
# ---------------------------------------------------------------------------

def _strip_ns(tag: str) -> str:
    return tag.split("}")[-1] if "}" in tag else tag


def _parse_units_xml(
    data: bytes,
    category: str,
    unit_tag: str,
    accumulator: dict[str, dict],
) -> int:
    """Parse one UTF-16 XML file from the bulk export, aggregate into accumulator.

    Uses iterparse with root.clear() after each unit record to keep memory flat.
    Returns number of records processed.
    """
    count = 0
    root: ET.Element | None = None
    try:
        context = ET.iterparse(io.BytesIO(data), events=("start", "end"))
        for event, elem in context:
            local = _strip_ns(elem.tag)
            if event == "start" and root is None:
                root = elem
                continue
            if event != "end" or local != unit_tag:
                continue

            gemeinde = ""
            power    = Decimal("0")
            for child in elem:
                name = _strip_ns(child.tag)
                if name == _GEMEINDE_TAG and child.text:
                    gemeinde = child.text.strip()
                elif name in _POWER_TAGS and child.text and power == 0:
                    try:
                        power = Decimal(child.text.strip().replace(",", "."))
                    except InvalidOperation:
                        pass

            if root is not None:
                root.clear()  # drop processed children, keeps memory flat

            if not gemeinde or len(gemeinde) < 5:
                continue

            kreis_ags = gemeinde[:5].zfill(5)

            if kreis_ags not in accumulator:
                accumulator[kreis_ags] = {
                    "solar_count":  0, "solar_kwp":    Decimal("0"),
                    "wind_count":   0, "wind_kw":      Decimal("0"),
                    "biomass_count":0, "biomass_kw":   Decimal("0"),
                    "ev_chargers":  0,
                }

            if category == "solar":
                accumulator[kreis_ags]["solar_count"] += 1
                accumulator[kreis_ags]["solar_kwp"]   += power
            elif category == "wind":
                accumulator[kreis_ags]["wind_count"]  += 1
                accumulator[kreis_ags]["wind_kw"]     += power
            elif category == "biomasse":
                accumulator[kreis_ags]["biomass_count"] += 1
                accumulator[kreis_ags]["biomass_kw"]    += power

            count += 1
    except ET.ParseError as exc:
        logger.warning("MaStR: XML parse error in %s file: %s", category, exc)

    return count


def _process_zip(zf: zipfile.ZipFile) -> dict[str, dict]:
    """Extract and parse relevant XML files from an open ZipFile."""
    accumulator: dict[str, dict] = {}
    names = zf.namelist()
    logger.info("MaStR: ZIP contains %d files", len(names))

    for category, (pattern, unit_tag) in FILE_PATTERNS.items():
        matched = sorted(n for n in names if pattern.match(n.split("/")[-1]))
        if not matched:
            logger.warning("MaStR: no files matched pattern for %s", category)
            continue
        logger.info("MaStR: processing %d file(s) for %s", len(matched), category)
        total_records = 0
        for name in matched:
            info = zf.getinfo(name)
            logger.info(
                "MaStR: reading %s (%.1f MB compressed)", name, info.compress_size / 1e6
            )
            try:
                data = zf.read(name)
            except Exception as exc:
                logger.error("MaStR: could not read %s: %s", name, exc)
                continue
            n = _parse_units_xml(data, category, unit_tag, accumulator)
            total_records += n
            logger.info("MaStR: %s — %d records from %s", category, n, name)
        logger.info("MaStR: %s total: %d records", category, total_records)

    return accumulator


# ---------------------------------------------------------------------------
# Fetcher
# ---------------------------------------------------------------------------

class MastrFetcher(BaseFetcher):
    def fetch(self) -> list[RenewablesRaw]:
        import os
        os.makedirs(CACHE_DIR, exist_ok=True)

        # The httpx.Client must stay open for the entire duration of _process_zip
        # when using range requests — the ZipFile reads stream back through it.
        with httpx.Client(timeout=300, follow_redirects=True) as client:
            zip_url = _discover_zip_url(client)
            if not zip_url:
                logger.error("MaStR: cannot proceed without a ZIP URL")
                return []

            zf = _open_zip_range(zip_url, client)

            if zf is None:
                # Fallback: cached or full download (client not needed after open)
                cached = _find_cached_zip()
                if cached:
                    logger.info("MaStR: using cached ZIP %s", cached)
                    try:
                        zf = zipfile.ZipFile(cached)
                    except Exception as exc:
                        logger.error("MaStR: could not open cached ZIP: %s", exc)

            if zf is None:
                dest = _download_zip_to_cache(zip_url, client)
                if dest:
                    try:
                        zf = zipfile.ZipFile(dest)
                    except Exception as exc:
                        logger.error("MaStR: could not open downloaded ZIP: %s", exc)

            if zf is None:
                logger.error("MaStR: all ZIP access methods failed — returning empty")
                return []

            with zf:
                accumulator = _process_zip(zf)

        today = date.today()
        rows: list[RenewablesRaw] = []
        for ags, agg in accumulator.items():
            rows.append(RenewablesRaw(
                ags=ags,
                district_name="",   # no name in Gemeindeschlüssel; API fills from employment data
                solar_count=agg["solar_count"],
                solar_kwp=agg["solar_kwp"],
                wind_count=agg["wind_count"],
                wind_kw=agg["wind_kw"],
                biomass_count=agg["biomass_count"],
                biomass_kw=agg["biomass_kw"],
                ev_chargers=agg["ev_chargers"],
                data_date=today,
            ))

        logger.info("MaStR: produced %d RenewablesRaw rows from bulk ZIP", len(rows))
        return rows

    def health_check(self) -> bool:
        try:
            with httpx.Client(timeout=15) as client:
                resp = client.head(DOWNLOAD_PAGE, follow_redirects=True, timeout=15)
                return resp.status_code == 200
        except Exception:
            return False


def run() -> None:
    """Entry point called by scheduler and run_once.py."""
    from db.writer import write_renewables_batch

    logger.info("=== MaStR renewables fetch (bulk ZIP) ===")
    fetcher = MastrFetcher()
    rows = fetcher.fetch()
    logger.info("MaStR: writing %d rows to DB", len(rows))
    write_renewables_batch(rows)
