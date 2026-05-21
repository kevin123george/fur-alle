"""Force-run all fetchers immediately — use to seed a fresh deployment."""
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from fetchers.brightsky import BrightskyFetcher
from fetchers.uba import UbaFetcher
from fetchers.bundesagentur import BundesagenturFetcher
from fetchers.vacancies import VacanciesFetcher
from fetchers.smard import SmardFetcher
import fetchers.zensus as zensus
import fetchers.mastr as mastr
import fetchers.kba as kba
import fetchers.inkar as inkar

from transformers.brightsky import validate_rows as vw
from transformers.uba import validate_rows as va
from transformers.bundesagentur import validate_rows as ve
from transformers.smard import validate_rows as vs

from db.writer import (
    write_weather_batch,
    write_air_quality_batch,
    write_employment_batch,
    write_vacancies_batch,
    write_energy_batch,
)

import traceback

def run(name, fn):
    print(f"\n{'='*50}\n▶ {name}\n{'='*50}")
    try:
        fn()
        print(f"✓ {name} done")
    except Exception:
        print(f"✗ {name} FAILED")
        traceback.print_exc()

run("Energy (SMARD)",        lambda: write_energy_batch(vs(SmardFetcher().fetch())))
run("Weather (DWD)",         lambda: write_weather_batch(vw(BrightskyFetcher().fetch())))
run("Air Quality (UBA)",     lambda: write_air_quality_batch(va(UbaFetcher().fetch())))
run("Employment (BA)",       lambda: write_employment_batch(ve(BundesagenturFetcher().fetch())))
run("Vacancies (BA)",        lambda: write_vacancies_batch(VacanciesFetcher().fetch()))
run("Demographics (Zensus)", lambda: zensus.run())
run("Renewables (MaStR)",    lambda: mastr.run())
run("Vehicles (KBA)",        lambda: kba.run())
run("INKAR (all)",           lambda: inkar.run())

print("\n✅ All done")
