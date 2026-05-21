"""Manual trigger for testing — runs any fetcher once without the scheduler.

Usage:
    python run_once.py <source>

Sources:
    energy                SMARD energy data (every 15 min via scheduler)
    employment            Bundesagentur unemployment by Kreis (monthly)
    employment_extended   BA extended metrics: Langzeit, U25, Ältere, SGB-II (monthly)
    weather               Brightsky / DWD current weather (hourly)
    airquality            UBA air quality (every 3 hours)
    zensus                Destatis GENESIS population by Kreis (yearly, cached 90 days)
    mastr                 MaStR renewables by Kreis (weekly)
    kba                   KBA vehicle registrations by Kreis (quarterly)
    bundestagswahl        Bundestagswahl results (manual only — not in scheduler)
    vacancies             BA open job vacancies by Kreis (monthly)
    natpop                Births & deaths by Kreis — Regionaldatenbank (yearly)
    gdp                   GDP per capita by Kreis — Regionaldatenbank (yearly)
    broadband             Broadband coverage — Bundesnetzagentur (yearly)
    commuters             Commuter flows — BA Pendlerstatistik (yearly)
    housing               Rent & vacancy — BBSR (yearly)
    healthcare            Doctors & hospital beds — Regionaldatenbank (yearly)
    transit               DB train stations by Kreis (yearly)
    inkar                 INKAR 2025 (BBSR) — all 8 Phase-2 sources in one pass (yearly)
    cpi                   German CPI year-over-year by category — ECB SDMX (monthly)
    fuel                  Fuel prices per Kreis — Tankerkönig (every 3h, needs API key)
    clusters              ML K-means clustering — reads from all *_current tables
    all                   All sources except bundestagswahl
"""
import logging
import os
import sys

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def run_energy() -> None:
    from fetchers.smard import SmardFetcher
    from transformers.smard import validate_rows
    from db.writer import write_energy_batch

    logger.info("=== SMARD energy fetch ===")
    fetcher = SmardFetcher()
    raw = fetcher.fetch()
    valid = validate_rows(raw)
    logger.info("Fetched %d rows, %d valid", len(raw), len(valid))
    write_energy_batch(valid)


def run_employment() -> None:
    from fetchers.bundesagentur import BundesagenturFetcher
    from transformers.bundesagentur import validate_rows
    from db.writer import write_employment_batch

    logger.info("=== Bundesagentur employment fetch ===")
    fetcher = BundesagenturFetcher()
    raw = fetcher.fetch()
    valid = validate_rows(raw)
    logger.info("Fetched %d rows, %d valid", len(raw), len(valid))
    write_employment_batch(valid)


def run_weather() -> None:
    from fetchers.brightsky import BrightskyFetcher
    from transformers.brightsky import validate_rows
    from db.writer import write_weather_batch

    logger.info("=== Brightsky weather fetch ===")
    fetcher = BrightskyFetcher()
    raw = fetcher.fetch()
    valid = validate_rows(raw)
    logger.info("Fetched %d rows, %d valid", len(raw), len(valid))
    write_weather_batch(valid)


def run_airquality() -> None:
    from fetchers.uba import UbaFetcher
    from transformers.uba import validate_rows
    from db.writer import write_air_quality_batch

    logger.info("=== UBA air quality fetch ===")
    fetcher = UbaFetcher()
    raw = fetcher.fetch()
    valid = validate_rows(raw)
    logger.info("Fetched %d rows, %d valid", len(raw), len(valid))
    write_air_quality_batch(valid)


def run_zensus() -> None:
    import fetchers.zensus as zensus
    zensus.run()


def run_mastr() -> None:
    import fetchers.mastr as mastr
    mastr.run()


def run_kba() -> None:
    import fetchers.kba as kba
    kba.run()


def run_bundestagswahl() -> None:
    import fetchers.bundestagswahl as bundestagswahl
    bundestagswahl.run()


def run_vacancies() -> None:
    import fetchers.vacancies as vacancies
    vacancies.run()


def run_employment_extended() -> None:
    import fetchers.employment_extended as employment_extended
    employment_extended.run()


def run_natpop() -> None:
    import fetchers.natpop as natpop
    natpop.run()


def run_gdp() -> None:
    import fetchers.gdp as gdp
    gdp.run()


def run_broadband() -> None:
    import fetchers.broadband as broadband
    broadband.run()


def run_commuters() -> None:
    import fetchers.commuters as commuters
    commuters.run()


def run_housing() -> None:
    import fetchers.housing as housing
    housing.run()


def run_healthcare() -> None:
    import fetchers.healthcare as healthcare
    healthcare.run()


def run_transit() -> None:
    import fetchers.transit as transit
    transit.run()


def run_inkar() -> None:
    import fetchers.inkar as inkar
    inkar.run()


def run_cpi() -> None:
    import fetchers.cpi as cpi
    cpi.run()


def run_fuel() -> None:
    import fetchers.tankerkoenig as tankerkoenig
    tankerkoenig.run()


def run_clusters() -> None:
    import fetchers.ml_clustering as ml_clustering
    ml_clustering.run()


SOURCES: dict[str, tuple] = {
    "energy":          (run_energy,),
    "employment":      (run_employment,),
    "employment_extended": (run_employment_extended,),
    "weather":         (run_weather,),
    "airquality":      (run_airquality,),
    "zensus":          (run_zensus,),
    "mastr":           (run_mastr,),
    "kba":             (run_kba,),
    "bundestagswahl":  (run_bundestagswahl,),
    "vacancies":       (run_vacancies,),
    "natpop":          (run_natpop,),
    "gdp":             (run_gdp,),
    "broadband":       (run_broadband,),
    "commuters":       (run_commuters,),
    "housing":         (run_housing,),
    "healthcare":      (run_healthcare,),
    "transit":         (run_transit,),
    "inkar":           (run_inkar,),
    "cpi":             (run_cpi,),
    "fuel":            (run_fuel,),
    "clusters":        (run_clusters,),
}

ALL_SOURCES_EXCEPT_BTW = [
    "energy", "employment", "weather", "airquality",
    "zensus", "mastr", "kba", "vacancies",
    "inkar",  # covers: employment_extended, natpop, gdp, broadband, commuters, housing, healthcare, transit
    "cpi",
]


if __name__ == "__main__":
    if len(sys.argv) < 2:
        target = "energy"
    else:
        target = sys.argv[1]

    if target == "all":
        for name in ALL_SOURCES_EXCEPT_BTW:
            fn = SOURCES[name][0]
            try:
                fn()
            except Exception as exc:
                logger.error("Source '%s' failed: %s", name, exc, exc_info=True)
    elif target in SOURCES:
        SOURCES[target][0]()
    else:
        valid = " | ".join(list(SOURCES.keys()) + ["all"])
        print(f"Unknown source: {target!r}. Valid choices: {valid}")
        sys.exit(1)
