#!/bin/bash
set -e

echo "=== Für Alle ETL ==="

# Allow docker-compose `command:` overrides to pass through (e.g. migrate service)
if [ $# -gt 0 ]; then
    exec "$@"
fi

echo "Starting initial data fetch..."

# Core datasets needed for the main dashboard panels
python run_once.py inkar      # 13 INKAR tables — takes ~5 min on first run (414 MB download)
python run_once.py energy     # SMARD live grid data
python run_once.py employment # BA unemployment by Kreis

echo "Initial fetch done. Starting scheduler..."
exec python scheduler.py
