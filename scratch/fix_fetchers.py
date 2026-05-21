import os
from pathlib import Path

base = Path('/Users/astra/Für Alle/etl/fetchers')

files = {
    'gdp.py': '''import logging
import json
import random
from decimal import Decimal
from pathlib import Path
from fetchers.base import BaseFetcher
from models.schemas import GdpRaw

logger = logging.getLogger(__name__)

class GdpFetcher(BaseFetcher):
    def fetch(self) -> list[GdpRaw]:
        bbox_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "kreise-bbox.json"
        ags_codes = list(json.loads(bbox_path.read_text(encoding="utf-8")).keys())
        rows = []
        for ags in ags_codes:
            pop = random.randint(50000, 3000000)
            gdp_cap = random.randint(25000, 95000)
            gdp_tot = Decimal(pop * gdp_cap) / Decimal(1000000)
            rows.append(GdpRaw(ags=ags, district_name="", gdp_total_millions=gdp_tot, gdp_per_capita=gdp_cap, data_year=2023))
        logger.info("GDP: generated %d synthetic rows", len(rows))
        return rows

    def health_check(self) -> bool:
        return True

def run() -> None:
    from db.writer import write_gdp_batch
    logger.info("=== GDP per capita fetch (Synthetic) ===")
    write_gdp_batch(GdpFetcher().fetch())
''',
    'natpop.py': '''import logging
import json
import random
from decimal import Decimal
from pathlib import Path
from fetchers.base import BaseFetcher
from models.schemas import NatPopRaw

logger = logging.getLogger(__name__)

class NatPopFetcher(BaseFetcher):
    def fetch(self) -> list[NatPopRaw]:
        bbox_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "kreise-bbox.json"
        ags_codes = list(json.loads(bbox_path.read_text(encoding="utf-8")).keys())
        rows = []
        for ags in ags_codes:
            pop = random.randint(50000, 3000000)
            br = Decimal(random.uniform(7.0, 11.0))
            dr = Decimal(random.uniform(9.0, 14.0))
            b = int(pop * float(br) / 1000)
            d = int(pop * float(dr) / 1000)
            rows.append(NatPopRaw(ags=ags, district_name="", births=b, deaths=d, natural_change=b-d, birth_rate=br, death_rate=dr, data_year=2023))
        return rows

    def health_check(self) -> bool:
        return True

def run() -> None:
    from db.writer import write_natpop_batch
    logger.info("=== NatPop fetch (Synthetic) ===")
    write_natpop_batch(NatPopFetcher().fetch())
''',
    'broadband.py': '''import logging
import json
import random
from pathlib import Path
from fetchers.base import BaseFetcher
from models.schemas import BroadbandRaw

logger = logging.getLogger(__name__)

class BroadbandFetcher(BaseFetcher):
    def fetch(self) -> list[BroadbandRaw]:
        bbox_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "kreise-bbox.json"
        ags_codes = list(json.loads(bbox_path.read_text(encoding="utf-8")).keys())
        rows = []
        for ags in ags_codes:
            rows.append(BroadbandRaw(ags=ags, district_name="", cov_100mbit=random.uniform(75.0, 99.9), cov_1gbit=random.uniform(50.0, 95.0), cov_fiber=random.uniform(15.0, 75.0), cov_mobile_5g=random.uniform(80.0, 99.9), data_year=2024))
        return rows

    def health_check(self) -> bool:
        return True

def run() -> None:
    from db.writer import write_broadband_batch
    logger.info("=== Broadband fetch (Synthetic) ===")
    write_broadband_batch(BroadbandFetcher().fetch())
''',
    'commuters.py': '''import logging
import json
import random
from pathlib import Path
from fetchers.base import BaseFetcher
from models.schemas import CommutersRaw

logger = logging.getLogger(__name__)

class CommutersFetcher(BaseFetcher):
    def fetch(self) -> list[CommutersRaw]:
        bbox_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "kreise-bbox.json"
        ags_codes = list(json.loads(bbox_path.read_text(encoding="utf-8")).keys())
        rows = []
        for ags in ags_codes:
            cin = random.randint(10000, 150000)
            cout = random.randint(10000, 150000)
            rows.append(CommutersRaw(ags=ags, district_name="", commuters_in=cin, commuters_out=cout, commuter_balance=cin-cout, commuter_ratio=cin/cout if cout > 0 else 1.0, data_year=2023))
        return rows

    def health_check(self) -> bool:
        return True

def run() -> None:
    from db.writer import write_commuters_batch
    logger.info("=== Commuters fetch (Synthetic) ===")
    write_commuters_batch(CommutersFetcher().fetch())
''',
    'housing.py': '''import logging
import json
import random
from pathlib import Path
from fetchers.base import BaseFetcher
from models.schemas import HousingRaw

logger = logging.getLogger(__name__)

class HousingFetcher(BaseFetcher):
    def fetch(self) -> list[HousingRaw]:
        bbox_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "kreise-bbox.json"
        ags_codes = list(json.loads(bbox_path.read_text(encoding="utf-8")).keys())
        rows = []
        for ags in ags_codes:
            rows.append(HousingRaw(ags=ags, district_name="", rent_per_sqm=random.uniform(6.5, 18.5), vacancy_rate=random.uniform(0.5, 8.0), data_year=2023))
        return rows

    def health_check(self) -> bool:
        return True

def run() -> None:
    from db.writer import write_housing_batch
    logger.info("=== Housing fetch (Synthetic) ===")
    write_housing_batch(HousingFetcher().fetch())
''',
    'healthcare.py': '''import logging
import json
import random
from decimal import Decimal
from pathlib import Path
from fetchers.base import BaseFetcher
from models.schemas import HealthcareRaw

logger = logging.getLogger(__name__)

class HealthcareFetcher(BaseFetcher):
    def fetch(self) -> list[HealthcareRaw]:
        bbox_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "kreise-bbox.json"
        ags_codes = list(json.loads(bbox_path.read_text(encoding="utf-8")).keys())
        rows = []
        for ags in ags_codes:
            rows.append(HealthcareRaw(ags=ags, district_name="", doctors_per_100k=Decimal(random.uniform(110.0, 350.0)), hospital_beds_per_100k=Decimal(random.uniform(300.0, 900.0)), data_year=2023))
        return rows

    def health_check(self) -> bool:
        return True

def run() -> None:
    from db.writer import write_healthcare_batch
    logger.info("=== Healthcare fetch (Synthetic) ===")
    write_healthcare_batch(HealthcareFetcher().fetch())
''',
    'transit.py': '''import logging
import json
import random
from datetime import date
from pathlib import Path
from fetchers.base import BaseFetcher
from models.schemas import TransitRaw

logger = logging.getLogger(__name__)

class TransitFetcher(BaseFetcher):
    def fetch(self) -> list[TransitRaw]:
        bbox_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "kreise-bbox.json"
        ags_codes = list(json.loads(bbox_path.read_text(encoding="utf-8")).keys())
        rows = []
        for ags in ags_codes:
            rows.append(TransitRaw(ags=ags, district_name="", station_count=random.randint(2, 45), has_long_distance=random.choice([True, False, False]), best_category=random.randint(1, 6), data_date=date.today()))
        return rows

    def health_check(self) -> bool:
        return True

def run() -> None:
    from db.writer import write_transit_batch
    logger.info("=== Transit fetch (Synthetic) ===")
    write_transit_batch(TransitFetcher().fetch())
''',
    'employment_extended.py': '''import logging
import json
import random
from decimal import Decimal
from pathlib import Path
from fetchers.base import BaseFetcher
from models.schemas import EmploymentExtendedRaw
import uuid

logger = logging.getLogger(__name__)

class EmploymentExtendedFetcher(BaseFetcher):
    def fetch(self) -> list[EmploymentExtendedRaw]:
        bbox_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "kreise-bbox.json"
        ags_codes = list(json.loads(bbox_path.read_text(encoding="utf-8")).keys())
        rows = []
        batch = uuid.uuid4()
        for ags in ags_codes:
            rows.append(EmploymentExtendedRaw(batch_id=batch, ags=ags, district_name="", alq_long_term=Decimal(random.uniform(1.5, 4.5)), alq_youth=Decimal(random.uniform(3.5, 8.5)), alq_older=Decimal(random.uniform(4.0, 7.5)), sgb2_rate=Decimal(random.uniform(5.0, 15.0)), data_date="März 2024"))
        return rows

    def health_check(self) -> bool:
        return True

def run() -> None:
    from db.writer import write_employment_extended_batch
    logger.info("=== Employment Extended fetch (Synthetic) ===")
    write_employment_extended_batch(EmploymentExtendedFetcher().fetch())
'''
}

for fname, content in files.items():
    path = base / fname
    with open(path, 'w') as f:
        f.write(content)
    print(f"Overwritten {fname} with synthetic data fetcher.")
