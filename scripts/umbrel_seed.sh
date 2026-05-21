#!/bin/bash
set -e
cd ~/furalle/furalle

echo "==> Copying updated files into ETL container..."
sudo docker cp data/static/kreise.geo.json furalle-etl-1:/data/static/kreise.geo.json
sudo docker cp etl/fetchers/brightsky.py furalle-etl-1:/app/fetchers/brightsky.py
sudo docker cp etl/fetchers/uba.py furalle-etl-1:/app/fetchers/uba.py
sudo docker cp etl/run_all_now.py furalle-etl-1:/app/run_all_now.py

echo "==> Running all fetchers..."
sudo docker exec -it furalle-etl-1 python run_all_now.py
