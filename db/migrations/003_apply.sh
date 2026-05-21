#!/bin/bash
set -e
DB="${1:-fueralle}"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Applying migrations to database: $DB"
for f in "$DIR"/0*.sql; do
    echo "  → $(basename "$f")"
    psql -d "$DB" -f "$f"
done
echo "Done."
