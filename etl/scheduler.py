"""Production scheduler — runs all fetchers on their configured schedules."""
import logging
import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.executors.pool import ThreadPoolExecutor

from fetchers.smard import SmardFetcher
from fetchers.bundesagentur import BundesagenturFetcher
from fetchers.brightsky import BrightskyFetcher
from fetchers.uba import UbaFetcher
import fetchers.zensus as zensus
import fetchers.mastr as mastr
import fetchers.kba as kba
import fetchers.vacancies as vacancies
import fetchers.inkar as inkar
import fetchers.cpi as cpi
import fetchers.tankerkoenig as tankerkoenig
import fetchers.ml_clustering as ml_clustering
from transformers.smard import validate_rows as validate_energy
from transformers.bundesagentur import validate_rows as validate_employment
from transformers.brightsky import validate_rows as validate_weather
from transformers.uba import validate_rows as validate_airquality
from db.writer import (
    write_energy_batch,
    write_employment_batch,
    write_weather_batch,
    write_air_quality_batch,
)


def job_energy() -> None:
    try:
        rows = SmardFetcher().fetch()
        write_energy_batch(validate_energy(rows))
    except Exception as exc:
        logger.error("Energy job failed: %s", exc, exc_info=True)


def job_employment() -> None:
    try:
        rows = BundesagenturFetcher().fetch()
        write_employment_batch(validate_employment(rows))
    except Exception as exc:
        logger.error("Employment job failed: %s", exc, exc_info=True)


def job_weather() -> None:
    try:
        rows = BrightskyFetcher().fetch()
        write_weather_batch(validate_weather(rows))
    except Exception as exc:
        logger.error("Weather job failed: %s", exc, exc_info=True)


def job_airquality() -> None:
    try:
        rows = UbaFetcher().fetch()
        write_air_quality_batch(validate_airquality(rows))
    except Exception as exc:
        logger.error("Air quality job failed: %s", exc, exc_info=True)


def job_zensus() -> None:
    try:
        zensus.run()
    except Exception as exc:
        logger.error("Zensus job failed: %s", exc, exc_info=True)


def job_mastr() -> None:
    try:
        mastr.run()
    except Exception as exc:
        logger.error("MaStR job failed: %s", exc, exc_info=True)


def job_kba() -> None:
    try:
        kba.run()
    except Exception as exc:
        logger.error("KBA job failed: %s", exc, exc_info=True)


def job_vacancies() -> None:
    try:
        vacancies.run()
    except Exception as exc:
        logger.error("Vacancies job failed: %s", exc, exc_info=True)


def job_inkar() -> None:
    try:
        inkar.run()
    except Exception as exc:
        logger.error("INKAR job failed: %s", exc, exc_info=True)


def job_cpi() -> None:
    try:
        cpi.run()
    except Exception as exc:
        logger.error("CPI job failed: %s", exc, exc_info=True)


def job_fuel() -> None:
    try:
        tankerkoenig.run()
    except Exception as exc:
        logger.error("Fuel prices job failed: %s", exc, exc_info=True)


def job_clusters() -> None:
    try:
        ml_clustering.run()
    except Exception as exc:
        logger.error("ML clustering job failed: %s", exc, exc_info=True)


if __name__ == "__main__":
    import time as _time
    import signal

    executors = {
        "default": ThreadPoolExecutor(max_workers=6),
    }
    job_defaults = {
        "coalesce": True,       # skip missed runs instead of stacking
        "max_instances": 1,     # never run the same job twice at once
    }

    scheduler = BackgroundScheduler(executors=executors, job_defaults=job_defaults)

    # High-frequency
    scheduler.add_job(job_energy,      "interval", minutes=15,                          id="smard_energy")
    scheduler.add_job(job_weather,     "interval", hours=1,                             id="brightsky_weather")
    scheduler.add_job(job_airquality,  "interval", hours=3,                             id="uba_airquality")
    scheduler.add_job(job_fuel,        "interval", hours=3,                             id="tankerkoenig_fuel")

    # Monthly
    scheduler.add_job(job_employment,  "cron",     day=1,   hour=6,                    id="bundesagentur_employment")
    scheduler.add_job(job_vacancies,   "cron",     day=1,   hour=6,  minute=30,        id="ba_vacancies")
    scheduler.add_job(job_cpi,         "cron",     day=5,   hour=7,                    id="ecb_cpi")

    # Weekly / yearly
    scheduler.add_job(job_mastr,       "cron",     day_of_week="sun", hour=3,          id="mastr_renewables")
    scheduler.add_job(job_kba,         "cron",     month="1,4,7,10",  day=1,  hour=8, id="kba_vehicles")
    scheduler.add_job(job_clusters,    "cron",     day_of_week="sun", hour=4,          id="ml_clusters")

    # Daily (stagger by 1h to avoid DB contention)
    scheduler.add_job(job_zensus,      "cron",     hour=2,                             id="zensus_demographics")
    scheduler.add_job(job_inkar,       "cron",     hour=3,                             id="inkar_all")

    scheduler.start()
    logger.info("Scheduler started — %d jobs, up to 6 parallel workers", len(scheduler.get_jobs()))

    # Keep the process alive
    def _shutdown(signum, frame):
        logger.info("Shutting down scheduler…")
        scheduler.shutdown()
        raise SystemExit(0)

    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT, _shutdown)

    while True:
        _time.sleep(60)
