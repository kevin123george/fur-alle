# CLAUDE.md — Für Alle (German Open Data Dashboard)

## Project Overview

**Für Alle** is a German civic data dashboard inspired by [forthepeople.in](https://forthepeople.in).
The goal is to aggregate fragmented public data from Germany's 16 Bundesländer and 400+ Landkreise
into a single, clean, fast dashboard — making already-public information actually accessible.

This is a **civic/portfolio project** (not commercial). Prioritize correctness, transparency about
data sources and limitations, and legal compliance over feature breadth.

---

## Architecture

Three completely decoupled layers. They never call each other directly — **Postgres is the contract.**

```
┌─────────────────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│   Python ETL            │        │   Spring Boot API    │        │   Bun Frontend  │
│   (cron jobs)           │        │   (read-only)        │        │                 │
│                         │        │                      │        │                 │
│  Fetch raw govt data    │──────► │  SQL queries only    │──────► │  REST calls     │
│  Clean & transform      │  Write │  Expose REST API     │  JSON  │  Leaflet maps   │
│  Validate               │   to   │  DTOs + validation   │        │  Recharts       │
│  Write to Postgres      │   DB   │  No ETL logic here   │        │  Tailwind CSS   │
│  Run on schedule        │        │                      │        │                 │
└─────────────────────────┘        └──────────────────────┘        └─────────────────┘
           │                                  │
           └──────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │      PostgreSQL        │
            │                        │
            │  energy_raw            │  ← Python writes here first
            │  energy_current        │  ← promoted after validation
            │  employment_raw        │
            │  employment_current    │  ← Spring Boot reads only *_current
            │  ...                   │
            └────────────────────────┘
```

### Why this separation works
- Python ETL can crash and restart without affecting the API
- Spring Boot can restart without interrupting a running fetch job
- No threading issues across language boundaries — they never talk to each other directly
- No half-written data: Python writes to `*_raw` staging, promotes to `*_current` only after validation
- Spring Boot reads only from `*_current` — never sees an incomplete batch

---

## Folder Structure

```
für-alle/
├── etl/                              # Python ETL — runs independently
│   ├── fetchers/
│   │   ├── base.py                   # BaseFetcher ABC
│   │   ├── smard.py                  # Energy data (every 15 min)
│   │   ├── bundesagentur.py          # Employment by Kreis (monthly)
│   │   ├── vacancies.py              # Job vacancies by Kreis (monthly)
│   │   ├── zensus.py                 # Demographics/Zensus 2022 (yearly)
│   │   ├── mastr.py                  # Renewables per Kreis (weekly)
│   │   ├── bundestagswahl.py         # Election results (per election)
│   │   ├── kba.py                    # Vehicle registrations (quarterly)
│   │   ├── destatis.py               # Inflation / national stats (monthly)
│   │   └── regionaldaten.py          # Regional stats (yearly)
│   ├── transformers/
│   │   ├── smard.py                  # raw JSON → clean rows
│   │   ├── bundesagentur.py          # messy CSV → clean rows
│   │   ├── zensus.py                 # GENESIS JSON → clean rows
│   │   ├── mastr.py                  # OData JSON → aggregated rows
│   │   ├── bundestagswahl.py         # kerg2.csv → clean rows
│   │   ├── kba.py                    # KBA CSV → clean rows
│   │   └── destatis.py               # GENESIS CSV → clean rows
│   ├── models/
│   │   └── schemas.py                # Pydantic v2 models + license metadata
│   ├── db/
│   │   └── writer.py                 # staging → current promotion logic
│   ├── scheduler.py                  # APScheduler wires everything together
│   └── requirements.txt
│
├── api/                              # Spring Boot — read-only REST API
│   └── src/main/java/de/fueralle/api/
│       ├── energy/
│       ├── employment/
│       ├── vacancies/                # GET /api/vacancies, /api/vacancies/{ags}
│       ├── demographics/             # GET /api/demographics/{ags}
│       ├── renewables/               # GET /api/renewables/{ags}
│       ├── election/                 # GET /api/election/{ags}
│       ├── vehicles/                 # GET /api/vehicles/{ags}
│       └── config/
│
├── frontend/                         # Bun + React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── maps/                 # Leaflet choropleth components
│   │   │   ├── charts/               # Recharts wrappers
│   │   │   └── panels/               # Energy, Employment, etc.
│   │   ├── hooks/
│   │   │   ├── useEnergy.ts
│   │   │   └── useEmployment.ts
│   │   ├── pages/
│   │   │   ├── index.tsx             # Main dashboard
│   │   │   ├── impressum.tsx         # Legal requirement (§ 5 TMG)
│   │   │   └── datenschutz.tsx       # Privacy policy (DSGVO)
│   │   └── lib/
│   │       └── api.ts                # Typed API client
│   └── package.json
│
├── data/
│   └── static/                       # Static lookup files (checked in)
│       └── wahlkreis_ags.json        # Wahlkreis nr → AGS mapping (BTW)
│
├── db/
│   └── migrations/                   # SQL migration files (run in order)
│       ├── 001_energy.sql
│       ├── 002_employment.sql
│       ├── 004_requests.sql
│       ├── 005_weather.sql
│       ├── 006_airquality.sql
│       ├── 007_demographics.sql      # Zensus 2022
│       ├── 008_renewables.sql        # MaStR aggregated
│       ├── 009_election.sql          # Bundestagswahl
│       ├── 010_vehicles.sql          # KBA Bestandsstatistik
│       └── 011_vacancies.sql         # Bundesagentur Stellen
│
├── data/
│   └── raw/                          # Cached raw API responses (gitignored)
│       ├── smard/
│       └── bundesagentur/
│
└── CLAUDE.md
```

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| ETL | Python 3.12 + APScheduler | Pandas handles messy govt CSVs natively |
| ETL models | Pydantic v2 | Validation + serialization |
| API | Spring Boot 3 (Java 21) | Familiar stack, solid REST, read-only is simple |
| Frontend runtime | Bun | Fast, familiar from ToolBox project |
| Frontend framework | React + TypeScript | Component model fits dashboard panels |
| Maps | Leaflet + OpenStreetMap | DSGVO-safe, no IP leak to US servers |
| Charts | Recharts | Composable, good defaults |
| Styling | Tailwind CSS | Utility-first |
| Database | PostgreSQL | Shared contract between ETL and API |

---

## Data Sources & Refresh Cadence

| Panel | Source | Method | Cadence | Tables |
|---|---|---|---|---|
| Energy Transition | [SMARD](https://www.smard.de/) | REST API | Every 15 min | `energy_current` |
| Employment by Kreis | [Bundesagentur für Arbeit](https://statistik.arbeitsagentur.de/) | REST API | Monthly | `employment_current` |
| Job Vacancies | [Bundesagentur für Arbeit](https://statistik.arbeitsagentur.de/) | REST API | Monthly | `vacancies_current` |
| Demographics | [Destatis GENESIS](https://www-genesis.destatis.de/) table `12411-03-03-5-B` | REST API (anonymous) | Yearly | `demographics_current` |
| Renewable Energy | [Marktstammdatenregister (MaStR)](https://www.marktstammdatenregister.de/) | OData API | Weekly | `renewables_current` |
| Election Results | [Bundeswahlleiter](https://www.bundeswahlleiter.de/) | CSV download | Per election | `election_current` |
| Vehicle Registrations | [Kraftfahrtbundesamt (KBA)](https://www.kba.de/) | CSV download | Quarterly | `vehicles_current` |
| Weather | [DWD via Brightsky](https://brightsky.dev/) | REST API | Hourly | `weather_current` |
| Air Quality | [Umweltbundesamt (UBA)](https://www.umweltbundesamt.de/) | REST API | Hourly | `air_quality_current` |
| Infrastructure (OSM) | [OpenStreetMap / Overpass API](https://overpass-api.de/) | On-demand (frontend) | Live | — (no DB) |
| District Boundaries | [BKG OpenData](https://gdz.bkg.bund.de/) — VG250 | Static GeoJSON | Yearly | — (static asset) |

### New Sources — Implementation Notes

#### Demographics (`etl/fetchers/zensus.py`)
- Destatis GENESIS-Online REST v2 (anonymous, no auth needed up to ~10 req/min)
- Table `12411-03-03-5-B`: Bevölkerung nach Kreisen
- Fields fetched: `einwohner`, `flaeche_km2`, `bevoelkerungsdichte`, `privathaushalte`
- Fall back to Regionaldatenbank table `12411-01-01-4` if GENESIS is unavailable
- Cadence: yearly (cron: January 1st, 07:00)

#### Renewables (`etl/fetchers/mastr.py`)
- Marktstammdatenregister OData-style API (public, no auth)
- Endpoint: `https://www.marktstammdatenregister.de/MaStR/Einheit/EinheitJson/GetErweiterteOeffentlicheEinheitStromerzeugung`
- Query per Bundesland × Energieträger (Solarstrom, Wind, Biomasse), aggregate by `Landkreis`
- Fields: `solar_anlagen`, `solar_kwp`, `wind_anlagen`, `wind_kw`, `ev_ladepunkte`, `biomasse_anlagen`
- For EV chargers: query `GetErweiterteOeffentlicheEinheitStrom` (Ladeeinrichtungen)
- Cadence: weekly (cron: Sunday 03:00) — MaStR data is near-real-time but 400+ Kreise takes time
- License: Datenlizenz Deutschland dl-de/by-2-0

#### Election Results (`etl/fetchers/bundestagswahl.py`)
- CSV from Bundeswahlleiter: `https://www.bundeswahlleiter.de/bundestagswahlen/2021/ergebnisse/opendata/csv/`
  - File: `kerg2.csv` — Ergebnisse nach Wahlkreisen (BTW 2021)
- Wahlkreis → AGS mapping via static `data/static/wahlkreis_ags.json`
  (one Wahlkreis often covers multiple or partial Kreise; store as best-effort)
- Fields: `wahlbeteiligung`, `spd`, `cdu_csu`, `gruene`, `fdp`, `afd`, `linke`, `sonstige`
- Cadence: run once per election year (manual trigger via `run_once.py`)
- **Note in UI**: "Ergebnisse auf Wahlkreisebene — entspricht nicht exakt den Kreisgrenzen"

#### Vehicle Registrations (`etl/fetchers/kba.py`)
- KBA Bestandsstatistik CSV: `https://www.kba.de/SharedDocs/Downloads/DE/Statistik/Fahrzeuge/FZ3/fz3_2024.csv`
- Fields: `pkw_gesamt`, `pkw_je_1000_ew`, `elektro`, `elektro_anteil`, `hybrid`, `hybrid_anteil`
- AGS mapping via KBA `krs_schl` column (= AGS without leading zeros trimmed)
- Cadence: quarterly (cron: 1st of Jan/Apr/Jul/Oct, 08:00)
- License: Datenlizenz Deutschland dl-de/by-2-0

#### Job Vacancies (`etl/fetchers/vacancies.py`)
- Same BA API as employment, different metric: `StellenInstitution` (open positions)
- Endpoint: same `DIA_URL` in `bundesagentur.py`, param `metricName == "StellenInstitution"`
- Fields: `offene_stellen`, `gemeldete_stellen`, `vakanzzeit` (avg vacancy duration days)
- Cadence: monthly (same schedule as employment, run in same batch)
- Reuses the existing Kreis config list from `bundesagentur.py`

### Data Source Rules
- Always store raw response in `data/raw/{source}/{YYYY-MM-DD}.json` before transforming
- Always surface the `Datenstand` (data date) in the UI next to every metric
- Never display stale data silently — if a fetch fails, show last-known date + warning badge
- Spring Boot reads only from `*_current` tables — never from staging

---

## Staging Pattern (No Half-Written Data)

Python always writes to staging first, then promotes atomically:

```sql
-- 1. Python writes fresh batch to staging
INSERT INTO energy_raw (batch_id, ...) VALUES ($1, ...);

-- 2. After full batch validated, promote atomically
BEGIN;
  TRUNCATE energy_current;
  INSERT INTO energy_current SELECT * FROM energy_raw WHERE batch_id = $1;
COMMIT;

-- Spring Boot only ever reads this
SELECT * FROM energy_current;
```

---

## Python ETL Conventions

- One fetcher class per data source, each implements `BaseFetcher`:
  ```python
  class BaseFetcher(ABC):
      async def fetch(self) -> list[BaseModel]: ...
      async def health_check(self) -> bool: ...
  ```
- Log every fetch: source, timestamp, record count, any errors
- Raise `DataSourceError` on fetch failure — never silently swallow errors
- Store raw responses before any transformation

### Scheduler (`etl/scheduler.py`)
```python
from apscheduler.schedulers.blocking import BlockingScheduler
from fetchers import smard, bundesagentur, destatis, regionaldaten

scheduler = BlockingScheduler()

scheduler.add_job(smard.run,         'interval', minutes=15)
scheduler.add_job(bundesagentur.run, 'cron',     day=1,   hour=6)
scheduler.add_job(destatis.run,      'cron',     day=2,   hour=6)
scheduler.add_job(regionaldaten.run, 'cron',     month=1, day=1)

scheduler.start()
```

---

## Spring Boot Conventions

- Read-only service layer — no write operations, no ETL logic whatsoever
- One controller + service + DTO per domain (energy, employment, etc.)
- Every DTO includes a `datenstand: LocalDate` field — always returned in API responses
- CORS configured in `CorsConfig.java` to allow the Bun frontend origin

---

## Frontend Conventions

- Strict TypeScript — no `any`
- All chart and map components accept a `datenstand: string` prop and render a source/date badge
- Every chart credits its source inline: `Quelle: Destatis, Stand: März 2026`
- Maps use Leaflet + OSM tiles — no Mapbox, no Google Maps (DSGVO)
- District GeoJSON (VG250) loaded as static asset, not fetched per render
- Choropleth color scales: colorblind-friendly — ColorBrewer `YlOrRd` or `Blues`

---

## Legal & Compliance

### Impressum (§ 5 TMG — required by German law)
- Must be reachable within one click from the homepage
- Must contain: full name, physical address, contact email
- Route: `/impressum`

### DSGVO / GDPR
- No Google Analytics, no Mapbox — both leak user IPs to US servers
- Use Leaflet + OSM or self-hosted Protomaps tiles
- If analytics added later: Plausible (EU-hosted) only, with cookie consent

### Datenlizenz Deutschland (dl-de/by-2-0)
- Most GovData sources require attribution
- Every chart must credit its source inline
- License metadata stored per dataset in `etl/models/schemas.py`

---

## v1 Build Order

### Phase 1 — MVP (prove the concept)
1. **Energy Panel** — SMARD fetcher → Postgres → Spring Boot endpoint → live gauge in frontend
2. **Employment Panel** — Bundesagentur fetcher → choropleth map by Kreis
3. **Bürgeramt Wait Times** — top 10 cities, manually scraped for v1. The shareable hook.

### Phase 2 — Depth
4. Regional Stats Explorer (Regionaldatenbank)
5. Inflation Tracker (Destatis)

### Phase 3 — Stretch
6. Housing Heatmap (Mietspiegel — complex, methodology varies by city)
7. Business Health (registrations vs. insolvencies)

**Do not start Phase 2 until Phase 1 has real data flowing end-to-end.**

---

## Known Hard Problems

| Problem | Notes |
|---|---|
| GENESIS table IDs | Not human-readable (`61111-0001`). Maintain a `TABLE_MAP` dict in the fetcher. |
| Bürgeramt scraping | No unified API. Each city has different booking software. One scraper per city. |
| Mietspiegel inconsistency | Methodology differs by city. Never aggregate without an explicit disclaimer. |
| Regionaldatenbank freshness | Always check and expose `aktualisierung`. Never assume data is current. |
| Federal fragmentation | Some indicators defined differently per Land. Document methodological choices. |
| MaStR pagination | 400k+ entries in MaStR. Must paginate with `pageIndex` + `pageSize=5000`. Aggregate by `Landkreis` name, then join to AGS via name-matching (fuzzy if needed). |
| Wahlkreis ↔ AGS mismatch | Wahlkreise don't align with Kreis boundaries (cities are split, rural Kreise are merged). Use `wahlkreis_ags.json` static lookup; mark in UI as approximate. |
| KBA column names change | KBA CSV column names have changed between releases. Parse defensively, log unknowns. |
| Zensus 2022 regional codes | Zensus uses `Schlüssel` which may differ from standard AGS (leading zeros, city-state quirks). Normalise to 5-char AGS before writing. |
| GENESIS rate limit | Anonymous GENESIS API is throttled. Cache per-table responses in `data/raw/zensus/` and only re-fetch if >90 days old. |

---

## Dev Setup

```bash
# ETL (Python)
cd etl
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scheduler.py

# API (Spring Boot)
cd api
./mvnw spring-boot:run

# Frontend (Bun)
cd frontend
bun install
bun dev
```

Each service has its own `.env` file. Never commit secrets.

---

## What Success Looks Like (v1)

- Open the site and immediately see **live German grid energy data** — no clicks needed
- Select any **Landkreis** on a map and see its unemployment rate with source + date
- Valid **Impressum** and **Datenschutzerklärung** pages exist
- Every chart credits its source inline
- No third-party services leaking user IPs to non-EU servers
