"""Run all SQL migrations in order via psql. Safe to re-run (all use IF NOT EXISTS)."""
import glob
import os
import subprocess
import sys
from urllib.parse import urlparse

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

dsn = os.environ.get("DB_DSN", "host=postgres dbname=fueralle user=fueralle password=fueralle")

# Parse libpq DSN into env vars psql understands
env = os.environ.copy()
for part in dsn.split():
    if "=" in part:
        key, _, val = part.partition("=")
        mapping = {"host": "PGHOST", "dbname": "PGDATABASE", "user": "PGUSER", "password": "PGPASSWORD", "port": "PGPORT"}
        if key in mapping:
            env[mapping[key]] = val

migrations = sorted(glob.glob("/db/migrations/*.sql"))
if not migrations:
    print("No migration files found at /db/migrations/", file=sys.stderr)
    sys.exit(1)

print(f"Applying {len(migrations)} migration(s)...")
for path in migrations:
    name = os.path.basename(path)
    print(f"  {name}")
    result = subprocess.run(["psql", "-v", "ON_ERROR_STOP=1", "-f", path], env=env, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        sys.exit(result.returncode)

print("All migrations applied.")
