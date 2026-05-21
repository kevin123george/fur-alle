from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# License metadata
# ---------------------------------------------------------------------------

LICENSE_SMARD = {
    "name": "Datenlizenz Deutschland – Namensnennung – Version 2.0",
    "id": "dl-de/by-2-0",
    "url": "https://www.govdata.de/dl-de/by-2-0",
    "attribution": "Quelle: Bundesnetzagentur | SMARD.de",
}

LICENSE_BUNDESAGENTUR = {
    "name": "Datenlizenz Deutschland – Namensnennung – Version 2.0",
    "id": "dl-de/by-2-0",
    "url": "https://www.govdata.de/dl-de/by-2-0",
    "attribution": "Quelle: Statistik der Bundesagentur für Arbeit",
}

LICENSE_BRIGHTSKY = {
    "name": "Open Data — Deutscher Wetterdienst",
    "id": "CC-BY-4.0",
    "url": "https://creativecommons.org/licenses/by/4.0/",
    "attribution": "Quelle: Deutscher Wetterdienst via Brightsky",
}

LICENSE_UBA = {
    "name": "Datenlizenz Deutschland – Namensnennung – Version 2.0",
    "id": "dl-de/by-2-0",
    "url": "https://www.govdata.de/dl-de/by-2-0",
    "attribution": "Quelle: Umweltbundesamt (UBA)",
}

LICENSE_MASTR = {
    "name": "Datenlizenz Deutschland – Namensnennung – Version 2.0",
    "id": "dl-de/by-2-0",
    "url": "https://www.govdata.de/dl-de/by-2-0",
    "attribution": "Quelle: Bundesnetzagentur / Marktstammdatenregister",
}

LICENSE_DESTATIS = {
    "name": "Datenlizenz Deutschland – Namensnennung – Version 2.0",
    "id": "dl-de/by-2-0",
    "url": "https://www.govdata.de/dl-de/by-2-0",
    "attribution": "Quelle: Statistisches Bundesamt (Destatis)",
}

LICENSE_KBA = {
    "name": "Datenlizenz Deutschland – Namensnennung – Version 2.0",
    "id": "dl-de/by-2-0",
    "url": "https://www.govdata.de/dl-de/by-2-0",
    "attribution": "Quelle: Kraftfahrtbundesamt (KBA)",
}

LICENSE_BUNDESWAHLLEITER = {
    "name": "Datenlizenz Deutschland – Namensnennung – Version 2.0",
    "id": "dl-de/by-2-0",
    "url": "https://www.govdata.de/dl-de/by-2-0",
    "attribution": "Quelle: Der Bundeswahlleiter, Wiesbaden",
}

# ---------------------------------------------------------------------------
# SMARD lookup
# ---------------------------------------------------------------------------

SMARD_FILTER_NAMES: dict[int, str] = {
    410: "Netzlast gesamt",
    4068: "Photovoltaik",
    4067: "Wind Onshore",
    1225: "Wind Offshore",
    4066: "Biomasse",
}

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class EnergyRaw(BaseModel):
    batch_id: UUID
    filter_code: int
    ts_utc: datetime
    mwh_quarter: Decimal | None
    data_date: date


class EmploymentRaw(BaseModel):
    batch_id: UUID
    ags: str
    district_name: str
    unemployment_rate: Decimal | None
    unemployed: int | None
    data_date: str


class WeatherRaw(BaseModel):
    ags: str
    district_name: str
    temperature: Decimal | None
    wind_speed: Decimal | None
    precipitation: Decimal | None
    condition: str | None
    cloud_cover: int | None
    humidity: int | None
    data_date: datetime


class AirQualityRaw(BaseModel):
    ags: str
    district_name: str
    station_id: int
    station_name: str | None
    pm10: Decimal | None
    no2: Decimal | None
    o3: Decimal | None
    pm25: Decimal | None
    data_date: datetime


class DemographicsRaw(BaseModel):
    ags: str
    district_name: str
    population: int | None
    area_km2: Decimal | None
    population_density: Decimal | None
    private_households: int | None
    data_date: date | None


class RenewablesRaw(BaseModel):
    ags: str
    district_name: str
    solar_count: int
    solar_kwp: Decimal
    wind_count: int
    wind_kw: Decimal
    biomass_count: int
    biomass_kw: Decimal
    ev_chargers: int
    data_date: date


class ElectionRow(BaseModel):
    constituency_nr: int
    constituency_name: str
    election_year: int
    turnout: Decimal | None
    spd: Decimal | None
    cdu_csu: Decimal | None
    greens: Decimal | None
    fdp: Decimal | None
    afd: Decimal | None
    left_party: Decimal | None
    other: Decimal | None
    data_date: date


class VehiclesRaw(BaseModel):
    ags: str
    district_name: str
    cars_total: int | None
    cars_per_1000: Decimal | None
    electric: int | None
    electric_share: Decimal | None
    hybrid: int | None
    hybrid_share: Decimal | None
    data_date: date | None


class VacanciesRaw(BaseModel):
    batch_id: UUID
    ags: str
    district_name: str
    open_positions: int | None
    reported_positions: int | None
    avg_vacancy_days: int | None
    data_date: str


# ---------------------------------------------------------------------------
# New sources — Phase 2+
# ---------------------------------------------------------------------------

LICENSE_REGIONALSTATISTIK = {
    "name": "Datenlizenz Deutschland – Namensnennung – Version 2.0",
    "id": "dl-de/by-2-0",
    "url": "https://www.govdata.de/dl-de/by-2-0",
    "attribution": "Quelle: Statistische Ämter des Bundes und der Länder (Regionaldatenbank)",
}

LICENSE_BUNDESNETZAGENTUR = {
    "name": "Datenlizenz Deutschland – Namensnennung – Version 2.0",
    "id": "dl-de/by-2-0",
    "url": "https://www.govdata.de/dl-de/by-2-0",
    "attribution": "Quelle: Bundesnetzagentur",
}

LICENSE_BBSR = {
    "name": "Datenlizenz Deutschland – Namensnennung – Version 2.0",
    "id": "dl-de/by-2-0",
    "url": "https://www.govdata.de/dl-de/by-2-0",
    "attribution": "Quelle: Bundesinstitut für Bau-, Stadt- und Raumforschung (BBSR)",
}

LICENSE_DB = {
    "name": "Creative Commons Attribution 4.0 International",
    "id": "CC-BY-4.0",
    "url": "https://creativecommons.org/licenses/by/4.0/",
    "attribution": "Quelle: Deutsche Bahn AG (open data)",
}


class EmploymentExtendedRaw(BaseModel):
    """Extended BA employment metrics: long-term, youth, older, SGB-II rates."""
    batch_id: UUID
    ags: str
    district_name: str
    alq_long_term: Decimal | None   # Langzeitarbeitslosenquote
    alq_youth: Decimal | None       # Jugendarbeitslosenquote
    alq_older: Decimal | None       # Ältere Arbeitslosenquote
    sgb2_rate: Decimal | None       # SGB-II-Quote
    data_date: str


class NatPopRaw(BaseModel):
    """Natural population change (births & deaths) per Kreis."""
    ags: str
    district_name: str
    births: int | None
    deaths: int | None
    natural_change: int | None
    birth_rate: Decimal | None      # births per 1 000 population
    death_rate: Decimal | None      # deaths per 1 000 population
    data_year: int | None


class GdpRaw(BaseModel):
    """GDP per capita per Kreis (Regionaldatenbank)."""
    ags: str
    district_name: str
    gdp_total_millions: Decimal | None  # total BIP in Mio EUR
    gdp_per_capita: int | None          # EUR per inhabitant
    data_year: int | None


class BroadbandRaw(BaseModel):
    """Broadband coverage percentages per Kreis (Bundesnetzagentur)."""
    ags: str
    district_name: str
    cov_100mbit: float | None       # % households with ≥100 Mbit/s
    cov_1gbit: float | None         # % households with ≥1 Gbit/s
    cov_fiber: float | None         # % households with FTTH/B
    cov_mobile_5g: float | None     # % area with 5G
    data_year: int | None


class CommutersRaw(BaseModel):
    """Commuter flows (in / out) per Kreis (BA Pendlerstatistik)."""
    ags: str
    district_name: str
    commuters_in: int | None
    commuters_out: int | None
    commuter_balance: int | None        # in minus out
    commuter_ratio: float | None        # in / out (e.g. 1.23)
    data_year: int | None


class HousingRaw(BaseModel):
    """Housing market indicators per Kreis (BBSR)."""
    ags: str
    district_name: str
    rent_per_sqm: float | None      # Angebotsmiete €/m²
    vacancy_rate: float | None      # Leerstandsquote %
    data_year: int | None


class HealthcareRaw(BaseModel):
    """Healthcare density per Kreis (Regionaldatenbank)."""
    ags: str
    district_name: str
    doctors_per_100k: Decimal | None
    hospital_beds_per_100k: Decimal | None
    data_year: int | None


class TransitRaw(BaseModel):
    """Train station / transit connectivity per Kreis (Deutsche Bahn open data)."""
    ags: str
    district_name: str
    station_count: int
    has_long_distance: bool
    best_category: int              # 1 (best) – 7 (worst / no station)
    data_date: date | None


# ---------------------------------------------------------------------------
# INKAR 2025 — Phase 2+ social / structural indicators
# ---------------------------------------------------------------------------

LICENSE_INKAR = {
    "name": "Datenlizenz Deutschland – Namensnennung – Version 2.0",
    "id": "dl-de/by-2-0",
    "url": "https://www.govdata.de/dl-de/by-2-0",
    "attribution": "Quelle: BBSR – Indikatoren und Karten zur Raum- und Stadtentwicklung (INKAR 2025)",
}


class SocialRaw(BaseModel):
    """Social indicators per Kreis (INKAR 2025)."""
    ags: str
    district_name: str
    income_monthly_eur: Decimal | None   # net household income EUR/month/person (m_ek)
    child_poverty_pct: Decimal | None    # children in SGB-II households % (q_newfBGu15_bev)
    old_age_poverty_pct: Decimal | None  # old-age basic income recipients % (a_GSa)
    crime_rate_per_100k: Decimal | None  # crimes per 100 000 inhabitants (q_straf)
    data_year: int | None


class EducationRaw(BaseModel):
    """Education indicators per Kreis (INKAR 2025)."""
    ags: str
    district_name: str
    abitur_rate: Decimal | None   # school leavers with Abitur % (a_schul_abi)
    dropout_rate: Decimal | None  # school leavers without qualification % (a_schul_oA)
    data_year: int | None


class AccessibilityRaw(BaseModel):
    """Accessibility / distance-to-service indicators per Kreis (INKAR 2025)."""
    ags: str
    district_name: str
    dist_supermarket_m: int | None    # avg distance to nearest supermarket in meters (m_G02_SUP_DIST)
    dist_pharmacy_m: int | None       # avg distance to nearest pharmacy in meters (m_Q01_APO_DIST)
    dist_transit_stop_m: int | None   # avg distance to nearest transit stop in meters (m_OEV20_DIST)
    data_year: int | None


class EvRaw(BaseModel):
    """Electric vehicle indicators per Kreis (INKAR 2025)."""
    ags: str
    district_name: str
    ev_share_pct: Decimal | None      # EVs as % of all registered vehicles (a_elektro)
    chargers_per_10k: Decimal | None  # public charger points per 10 000 residents (q_ladepunkte)
    data_year: int | None


class PopulationDynamicsRaw(BaseModel):
    """Population dynamics indicators per Kreis (INKAR 2025)."""
    ags: str
    district_name: str
    avg_age: Decimal | None                  # average age of population (m_bev_alter)
    share_65plus: Decimal | None             # share of population aged 65+ % (a_bev65um)
    net_migration_per_1000: Decimal | None   # net migration per 1 000 inhabitants (i_wans)
    youth_migration_per_1000: Decimal | None # net migration aged 18–25 per 1 000 (i_wans_b_1825)
    pop_projection_2030_pct: Decimal | None  # projected population change 2022→2030 % (e_bev2230_rop45)
    data_year: int | None


class CpiRaw(BaseModel):
    """German CPI year-over-year % change by COICOP category (ECB SDMX API)."""
    batch_id: UUID
    category: str
    year_month: date
    yoy_pct: float | None


class FuelPriceRaw(BaseModel):
    """Average fuel prices per Kreis sampled from Tankerkönig stations."""
    ags: str
    district_name: str
    e5_avg: Decimal | None
    e10_avg: Decimal | None
    diesel_avg: Decimal | None
    station_count: int


class KreisClusterRaw(BaseModel):
    """ML K-means cluster assignment and similarity vector per Kreis."""
    ags: str
    district_name: str
    cluster_id: int
    cluster_label: str
    cluster_color: str
    similar_kreise: list[dict]   # top-5 most similar Kreise with similarity score
    feature_vector: list[float]  # standardised feature vector (for reference)
