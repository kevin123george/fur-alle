"""INKAR 2025 — BBSR comprehensive Kreis-level dataset.

Single source for 8 data tables. Downloads the INKAR ZIP from BBSR (~414 MB),
streams the 6.6 GB CSV once, and populates:
  employment_extended, natural_population, gdp, broadband,
  commuters, housing, healthcare, transit

Source: BBSR – Indikatoren und Karten zur Raum- und Stadtentwicklung
URL:    https://www.bbr-server.de/imagemap/inkar/download/inkar_2025.zip
License: Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0)
"""
import csv
import io
import logging
import os
import subprocess
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path
from uuid import uuid4

import httpx

from fetchers.base import BaseFetcher, DataSourceError
from models.schemas import (
    AccessibilityRaw, BroadbandRaw, CommutersRaw, EducationRaw,
    EmploymentExtendedRaw, EvRaw, GdpRaw,
    HealthcareRaw, HousingRaw, NatPopRaw, PopulationDynamicsRaw,
    SocialRaw, TransitRaw,
)

logger = logging.getLogger(__name__)

INKAR_URL = "https://www.bbr-server.de/imagemap/inkar/download/inkar_2025.zip"
INKAR_CSV = "inkar_2025.csv"
CACHE_DIR = Path(__file__).parent.parent.parent / "data" / "raw" / "inkar"
CACHE_MAX_AGE_DAYS = 350  # re-download at most once per year

# Indicator codes we extract from the CSV
TARGETS = {
    "q_bip_ew",       # GDP per capita in 1 000 EUR/person   (→ × 1000 = EUR)
    "bip",            # GDP total in 1 000 EUR               (→ / 1000 = millions EUR)
    "q_alo_u25",      # Youth unemployment rate %
    "q_alo_ü55",      # Older (55+) unemployment rate %
    "q_SGBII",        # SGB-II rate %
    "a_aloLang",      # Share of long-term unemployed among all unemployed %
    "q_hausarzt_bev", # GPs per 10 000 inhabitants           (→ × 10 = per 100 000)
    "q_betten_bev",   # Hospital beds per 1 000 inhabitants  (→ × 100 = per 100 000)
    "a_geb_bev",      # Birth rate per 1 000 inhabitants
    "i_saldo_nat",    # Natural pop. change per 1 000 inhabitants
    "m_mietpr",       # Listing rent EUR/m²
    "a_einp_sva",     # In-commuters as % of workplace SVB
    "a_ausp_svw",     # Out-commuters as % of residential SVB
    "sva",            # SVB at workplace (absolute)
    "svw",            # SVB at residence (absolute)
    "a_bb_100Mbits",  # % households with ≥100 Mbit/s
    "a_bb_1000Mbits", # % households with ≥1 Gbit/s
    "m_ErrIC_bev",    # Car travel time to nearest IC/ICE station (minutes)
    # Social
    "m_ek",           # Net household income EUR/month/person
    "q_newfBGu15_bev",# Children in SGB-II households %
    "a_GSa",          # Old-age basic income recipients %
    "q_straf",        # Crimes per 1 000 inhabitants
    # Education
    "a_schul_abi",    # School leavers with Abitur %
    "a_schul_oA",     # School leavers without qualification %
    # Accessibility (distances in meters)
    "m_G02_SUP_DIST", # Avg distance to nearest supermarket (m)
    "m_Q01_APO_DIST", # Avg distance to nearest pharmacy (m)
    "m_OEV20_DIST",   # Avg distance to nearest transit stop (m)
    # Electric vehicles
    "a_elektro",      # EVs as % of registered vehicles
    "q_ladepunkte",   # Public charger points per 10 000 residents
    # Population dynamics
    "m_bev_alter",    # Average age of population
    "a_bev65um",      # Share of population aged 65+ %
    "i_wans",         # Net migration per 1 000 inhabitants
    "i_wans_b_1825",  # Net migration aged 18–25 per 1 000
    "e_bev2230_rop45",# Projected population change 2022→2030 %
}

# Module-level cache so parallel fetcher calls re-use the same parsed data
_CACHE: dict[str, dict[str, tuple[str, str]]] | None = None


def _find_cached_zip() -> Path | None:
    os.makedirs(CACHE_DIR, exist_ok=True)
    cutoff = date.today() - timedelta(days=CACHE_MAX_AGE_DAYS)
    # Accept any *.zip in cache dir (dated or legacy name)
    best: tuple[date, Path] | None = None
    for p in CACHE_DIR.glob("*.zip"):
        try:
            d = date.fromisoformat(p.stem)
            if d >= cutoff and (best is None or d > best[0]):
                best = (d, p)
        except ValueError:
            # Legacy name like "inkar_2025.zip" — accept if it exists
            if p.stat().st_size > 1_000_000:
                return p
    return best[1] if best else None


def _download_zip() -> Path:
    path = CACHE_DIR / f"{date.today().isoformat()}.zip"
    logger.info("INKAR: downloading %s (~414 MB)", INKAR_URL)
    with httpx.Client(timeout=600, follow_redirects=True) as client:
        with client.stream("GET", INKAR_URL) as resp:
            resp.raise_for_status()
            total = int(resp.headers.get("content-length", 0))
            done = 0
            with open(path, "wb") as f:
                for chunk in resp.iter_bytes(1 << 20):
                    f.write(chunk)
                    done += len(chunk)
                    if total and done % (50 << 20) < (1 << 20):
                        logger.info("INKAR: %.0f%%", done / total * 100)
    logger.info("INKAR: cached to %s", path)
    return path


def _ensure_zip() -> Path:
    cached = _find_cached_zip()
    if cached:
        logger.info("INKAR: using cached ZIP %s", cached)
        return cached
    try:
        return _download_zip()
    except Exception as exc:
        raise DataSourceError(f"INKAR: download failed: {exc}") from exc


def _to_float(s: str) -> float | None:
    try:
        return float(s.replace(",", "."))
    except (ValueError, TypeError):
        return None


def _transit_category(minutes: float | None) -> int:
    if minutes is None: return 7
    if minutes <= 5:    return 1
    if minutes <= 15:   return 2
    if minutes <= 30:   return 3
    if minutes <= 45:   return 4
    if minutes <= 60:   return 5
    if minutes <= 90:   return 6
    return 7


def _stream_indicators(zip_path: Path) -> dict[str, dict[str, tuple[str, str]]]:
    """Stream the INKAR CSV and return {kuerzel: {ags: (latest_year, value)}}."""
    result: dict[str, dict[str, tuple[str, str]]] = {k: {} for k in TARGETS}
    n = 0

    logger.info("INKAR: streaming CSV (~2 min)")
    proc = subprocess.Popen(
        ["unzip", "-p", str(zip_path), INKAR_CSV],
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
    )
    reader = csv.reader(
        io.TextIOWrapper(proc.stdout, encoding="utf-8", errors="replace"),
        delimiter=";",
    )
    header_done = False
    for row in reader:
        if not header_done:
            header_done = True
            continue
        if len(row) < 9:
            continue
        kuerzel = row[2]
        if kuerzel not in TARGETS:
            continue
        if row[4] not in ("Kreise", "Kreis"):
            continue
        ags = row[5][:5]
        year, val = row[7], row[8]
        existing = result[kuerzel].get(ags)
        if existing is None or year > existing[0]:
            result[kuerzel][ags] = (year, val)
        n += 1
        if n % 1_000_000 == 0:
            logger.info("INKAR: %dM rows matched", n // 1_000_000)

    proc.wait()
    logger.info("INKAR: streaming done (%d rows matched)", n)
    return result


def _get_data(zip_path: Path) -> dict[str, dict[str, tuple[str, str]]]:
    global _CACHE
    if _CACHE is None:
        _CACHE = _stream_indicators(zip_path)
    return _CACHE


class InkarFetcher(BaseFetcher):
    """Downloads and parses INKAR 2025; builds rows for 8 destination tables."""

    def fetch(self) -> list:
        return []  # not used; call fetch_all() instead

    def fetch_all(self) -> dict[str, list]:
        zip_path = _ensure_zip()
        data = _get_data(zip_path)

        all_ags = set()
        for d in data.values():
            all_ags.update(d.keys())

        gdp_rows: list[GdpRaw] = []
        natpop_rows: list[NatPopRaw] = []
        healthcare_rows: list[HealthcareRaw] = []
        housing_rows: list[HousingRaw] = []
        commuters_rows: list[CommutersRaw] = []
        broadband_rows: list[BroadbandRaw] = []
        emp_ext_rows: list[EmploymentExtendedRaw] = []
        transit_rows: list[TransitRaw] = []
        social_rows: list[SocialRaw] = []
        education_rows: list[EducationRaw] = []
        accessibility_rows: list[AccessibilityRaw] = []
        ev_rows: list[EvRaw] = []
        popdyn_rows: list[PopulationDynamicsRaw] = []

        batch_id = uuid4()  # one batch for all employment_extended rows

        def get(kuerzel: str, ags: str) -> tuple[float | None, str | None]:
            entry = data[kuerzel].get(ags)
            if entry is None:
                return None, None
            return _to_float(entry[1]), entry[0]

        for ags in sorted(all_ags):
            # ── GDP ───────────────────────────────────────────────
            bip_ew, gdp_year = get("q_bip_ew", ags)
            bip_tot, _ = get("bip", ags)
            gdp_rows.append(GdpRaw(
                ags=ags, district_name="",
                gdp_per_capita=round(bip_ew * 1_000) if bip_ew is not None else None,
                gdp_total_millions=Decimal(str(round(bip_tot / 1_000, 1))) if bip_tot is not None else None,
                data_year=int(gdp_year) if gdp_year else None,
            ))

            # ── Natural population ────────────────────────────────
            geb, np_year = get("a_geb_bev", ags)
            saldo, _ = get("i_saldo_nat", ags)
            br = Decimal(str(round(geb, 2))) if geb is not None else None
            dr = Decimal(str(round(geb - saldo, 2))) if (geb is not None and saldo is not None) else None
            natpop_rows.append(NatPopRaw(
                ags=ags, district_name="",
                births=None, deaths=None, natural_change=None,
                birth_rate=br, death_rate=dr,
                data_year=int(np_year) if np_year else None,
            ))

            # ── Healthcare ────────────────────────────────────────
            gp, hc_year = get("q_hausarzt_bev", ags)
            beds, _ = get("q_betten_bev", ags)
            healthcare_rows.append(HealthcareRaw(
                ags=ags, district_name="",
                doctors_per_100k=Decimal(str(round(gp * 10, 1))) if gp is not None else None,
                hospital_beds_per_100k=Decimal(str(round(beds * 100, 1))) if beds is not None else None,
                data_year=int(hc_year) if hc_year else None,
            ))

            # ── Housing ───────────────────────────────────────────
            rent, h_year = get("m_mietpr", ags)
            housing_rows.append(HousingRaw(
                ags=ags, district_name="",
                rent_per_sqm=rent,
                vacancy_rate=None,
                data_year=int(h_year) if h_year else None,
            ))

            # ── Commuters ─────────────────────────────────────────
            einp_pct, c_year = get("a_einp_sva", ags)
            ausp_pct, _ = get("a_ausp_svw", ags)
            sva_v, _ = get("sva", ags)
            svw_v, _ = get("svw", ags)
            cin = round(sva_v * einp_pct / 100) if (sva_v and einp_pct is not None) else None
            cout = round(svw_v * ausp_pct / 100) if (svw_v and ausp_pct is not None) else None
            cbal = (cin - cout) if (cin is not None and cout is not None) else None
            crat = round(cin / cout, 2) if (cin and cout) else None
            commuters_rows.append(CommutersRaw(
                ags=ags, district_name="",
                commuters_in=cin, commuters_out=cout,
                commuter_balance=cbal, commuter_ratio=crat,
                data_year=int(c_year) if c_year else None,
            ))

            # ── Broadband ─────────────────────────────────────────
            bb100, bb_year = get("a_bb_100Mbits", ags)
            bb1g, _ = get("a_bb_1000Mbits", ags)
            broadband_rows.append(BroadbandRaw(
                ags=ags, district_name="",
                cov_100mbit=bb100, cov_1gbit=bb1g,
                cov_fiber=None, cov_mobile_5g=None,
                data_year=int(bb_year) if bb_year else None,
            ))

            # ── Employment extended ───────────────────────────────
            alo_lang, e_year = get("a_aloLang", ags)
            q_u25, _ = get("q_alo_u25", ags)
            q_55, _ = get("q_alo_ü55", ags)
            q_sgb, _ = get("q_SGBII", ags)
            emp_ext_rows.append(EmploymentExtendedRaw(
                batch_id=batch_id,
                ags=ags, district_name="",
                alq_long_term=Decimal(str(round(alo_lang, 1))) if alo_lang is not None else None,
                alq_youth=Decimal(str(round(q_u25, 1))) if q_u25 is not None else None,
                alq_older=Decimal(str(round(q_55, 1))) if q_55 is not None else None,
                sgb2_rate=Decimal(str(round(q_sgb, 1))) if q_sgb is not None else None,
                data_date=str(e_year) if e_year else "",
            ))

            # ── Transit (proxy: IC/ICE accessibility) ─────────────
            ic_min, t_year = get("m_ErrIC_bev", ags)
            transit_rows.append(TransitRaw(
                ags=ags, district_name="",
                station_count=0,
                has_long_distance=ic_min is not None and ic_min <= 15.0,
                best_category=_transit_category(ic_min),
                data_date=date(int(t_year), 1, 1) if t_year else date.today(),
            ))

            # ── Social ────────────────────────────────────────────
            income, s_year = get("m_ek", ags)
            child_pov, _ = get("q_newfBGu15_bev", ags)
            old_pov, _ = get("a_GSa", ags)
            crime, _ = get("q_straf", ags)
            social_rows.append(SocialRaw(
                ags=ags, district_name="",
                income_monthly_eur=Decimal(str(round(income, 2))) if income is not None else None,
                child_poverty_pct=Decimal(str(round(child_pov, 2))) if child_pov is not None else None,
                old_age_poverty_pct=Decimal(str(round(old_pov, 2))) if old_pov is not None else None,
                crime_rate_per_100k=Decimal(str(round(crime, 2))) if crime is not None else None,
                data_year=int(s_year) if s_year else None,
            ))

            # ── Education ─────────────────────────────────────────
            abi, ed_year = get("a_schul_abi", ags)
            drop, _ = get("a_schul_oA", ags)
            education_rows.append(EducationRaw(
                ags=ags, district_name="",
                abitur_rate=Decimal(str(round(abi, 2))) if abi is not None else None,
                dropout_rate=Decimal(str(round(drop, 2))) if drop is not None else None,
                data_year=int(ed_year) if ed_year else None,
            ))

            # ── Accessibility (distances in meters) ───────────────
            sup_dist, ac_year = get("m_G02_SUP_DIST", ags)
            apo_dist, _ = get("m_Q01_APO_DIST", ags)
            oev_dist, _ = get("m_OEV20_DIST", ags)
            accessibility_rows.append(AccessibilityRaw(
                ags=ags, district_name="",
                dist_supermarket_m=round(sup_dist) if sup_dist is not None else None,
                dist_pharmacy_m=round(apo_dist) if apo_dist is not None else None,
                dist_transit_stop_m=round(oev_dist) if oev_dist is not None else None,
                data_year=int(ac_year) if ac_year else None,
            ))

            # ── Electric vehicles ─────────────────────────────────
            ev_share, ev_year = get("a_elektro", ags)
            chargers, _ = get("q_ladepunkte", ags)
            ev_rows.append(EvRaw(
                ags=ags, district_name="",
                ev_share_pct=Decimal(str(round(ev_share, 2))) if ev_share is not None else None,
                chargers_per_10k=Decimal(str(round(chargers, 2))) if chargers is not None else None,
                data_year=int(ev_year) if ev_year else None,
            ))

            # ── Population dynamics ───────────────────────────────
            avg_age, pd_year = get("m_bev_alter", ags)
            sh65, _ = get("a_bev65um", ags)
            net_mig, _ = get("i_wans", ags)
            youth_mig, _ = get("i_wans_b_1825", ags)
            proj, _ = get("e_bev2230_rop45", ags)
            popdyn_rows.append(PopulationDynamicsRaw(
                ags=ags, district_name="",
                avg_age=Decimal(str(round(avg_age, 1))) if avg_age is not None else None,
                share_65plus=Decimal(str(round(sh65, 2))) if sh65 is not None else None,
                net_migration_per_1000=Decimal(str(round(net_mig, 2))) if net_mig is not None else None,
                youth_migration_per_1000=Decimal(str(round(youth_mig, 2))) if youth_mig is not None else None,
                pop_projection_2030_pct=Decimal(str(round(proj, 2))) if proj is not None else None,
                data_year=int(pd_year) if pd_year else None,
            ))

        logger.info(
            "INKAR: built rows — gdp=%d natpop=%d healthcare=%d housing=%d "
            "commuters=%d broadband=%d emp_ext=%d transit=%d "
            "social=%d education=%d accessibility=%d ev=%d popdyn=%d",
            len(gdp_rows), len(natpop_rows), len(healthcare_rows),
            len(housing_rows), len(commuters_rows), len(broadband_rows),
            len(emp_ext_rows), len(transit_rows),
            len(social_rows), len(education_rows), len(accessibility_rows),
            len(ev_rows), len(popdyn_rows),
        )
        return {
            "gdp": gdp_rows,
            "natpop": natpop_rows,
            "healthcare": healthcare_rows,
            "housing": housing_rows,
            "commuters": commuters_rows,
            "broadband": broadband_rows,
            "employment_extended": emp_ext_rows,
            "transit": transit_rows,
            "social": social_rows,
            "education": education_rows,
            "accessibility": accessibility_rows,
            "ev": ev_rows,
            "population_dynamics": popdyn_rows,
        }

    def health_check(self) -> bool:
        try:
            with httpx.Client(timeout=15) as c:
                return c.head(INKAR_URL, follow_redirects=True).status_code < 400
        except Exception:
            return False


def run() -> None:
    """Fetch INKAR and write all 13 datasets. Called by run_once.py."""
    from db.writer import (
        write_accessibility_batch, write_broadband_batch, write_commuters_batch,
        write_education_batch, write_employment_extended_batch, write_ev_batch,
        write_gdp_batch, write_healthcare_batch, write_housing_batch,
        write_natpop_batch, write_population_dynamics_batch,
        write_social_batch, write_transit_batch,
    )
    logger.info("=== INKAR 2025 fetch (all 13 sources) ===")
    datasets = InkarFetcher().fetch_all()

    write_gdp_batch(datasets["gdp"])
    write_natpop_batch(datasets["natpop"])
    write_healthcare_batch(datasets["healthcare"])
    write_housing_batch(datasets["housing"])
    write_commuters_batch(datasets["commuters"])
    write_broadband_batch(datasets["broadband"])
    write_employment_extended_batch(datasets["employment_extended"])
    write_transit_batch(datasets["transit"])
    write_social_batch(datasets["social"])
    write_education_batch(datasets["education"])
    write_accessibility_batch(datasets["accessibility"])
    write_ev_batch(datasets["ev"])
    write_population_dynamics_batch(datasets["population_dynamics"])
    logger.info("=== INKAR: all 13 tables updated ===")
