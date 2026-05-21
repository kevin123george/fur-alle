# Für Alle

Open data dashboard for Germany's 400+ Landkreise — unemployment, GDP, renewables, elections, housing, and more. All from official public sources, credited inline, always with the data date shown.

🔗 [fueralle.byastra.de](https://fueralle.byastra.de)

---

## Stack

```
Python ETL → PostgreSQL ← Spring Boot API ← React Frontend
```

- **ETL** — Python 3.12 + APScheduler + Pydantic v2. One fetcher per data source, staging → live promotion pattern.
- **API** — Spring Boot 3 (Java 21). Read-only REST, typed DTOs.
- **Frontend** — Bun + React + TypeScript + Recharts + Leaflet + DaisyUI v4.
- **Database** — PostgreSQL. The only shared contract between layers.

---

## Running locally

### Prerequisites

- Python 3.12
- Java 21 + Maven
- Bun
- PostgreSQL

### 1. Database

```bash
createdb fueralle
for f in db/migrations/*.sql; do psql -d fueralle -f "$f"; done
```

### 2. ETL (Python)

```bash
cd etl
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DATABASE_URL
python scheduler.py
```

To seed data immediately without waiting for the cron schedule:

```bash
python run_once.py all        # runs all fetchers once
python run_once.py energy     # SMARD energy data only
python run_once.py employment # Bundesagentur employment data only
```

### 3. API (Spring Boot)

```bash
cd api
# copy and edit application.properties — set datasource URL, username, password
cp src/main/resources/application.example.properties src/main/resources/application.properties
./mvnw spring-boot:run
# runs at http://localhost:8080
```

### 4. Frontend (Bun)

```bash
cd frontend
bun install
bun dev
# runs at http://localhost:5173
```

### With Docker Compose

```bash
cp .env.example .env   # fill in DB credentials
docker compose up -d
```

---

## Data sources

| Panel | Source | Cadence |
|---|---|---|
| Energy Transition | [SMARD](https://www.smard.de/) | Every 15 min |
| Employment | [Bundesagentur für Arbeit](https://statistik.arbeitsagentur.de/) | Monthly |
| Job Vacancies | Bundesagentur für Arbeit | Monthly |
| Demographics | [Destatis GENESIS](https://www-genesis.destatis.de/) | Yearly |
| Renewable Energy | [Marktstammdatenregister](https://www.marktstammdatenregister.de/) | Weekly |
| Election Results | [Bundeswahlleiter](https://www.bundeswahlleiter.de/) | Per election |
| Vehicle Registrations | [Kraftfahrtbundesamt](https://www.kba.de/) | Quarterly |
| Weather | [DWD via Brightsky](https://brightsky.dev/) | Hourly |
| Air Quality | [Umweltbundesamt](https://www.umweltbundesamt.de/) | Hourly |

All sources are public and free. Every chart credits its source inline.

---

## API endpoints

```
GET /api/stats               Site overview (data points, Kreise, requests)
GET /api/energy/latest       Current energy mix
GET /api/energy/current      Last 24 hours (all filters)
GET /api/employment          All Kreise with labour market data
GET /api/employment/{ags}    One Kreis by AGS (e.g. 09162 = München)
GET /api/weather/{ags}       Current weather for a Kreis
GET /api/airquality/{ags}    Current air quality for a Kreis
```

---

## Infrastructure

No cloud. Runs on a home server behind a [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) — no open inbound ports, no static IP required. One deploy command: rsync + `docker compose up -d --build`.

**Total running cost: €2/year** (domain only).

---

## License

MIT — see [LICENSE](LICENSE).

Data is sourced from open government datasets under [Datenlizenz Deutschland dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0).
