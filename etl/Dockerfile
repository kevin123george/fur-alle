FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    unzip \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY etl/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# DB migrations (copied from project root)
COPY db/migrations /db/migrations

# Static lookup data (wahlkreis mapping etc.)
COPY data/static /data/static

# ETL source
COPY etl/ .

COPY etl/docker_entrypoint.sh /docker_entrypoint.sh
RUN chmod +x /docker_entrypoint.sh

ENTRYPOINT ["/docker_entrypoint.sh"]
