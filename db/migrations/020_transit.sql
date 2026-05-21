-- Deutsche Bahn open data: train station / transit connectivity by Kreis
-- Source: Deutsche Bahn AG – Bahnhofsliste (open data, no auth required)
-- URL: https://download.deutschebahn.com/static/datasets/bahnhof/D_Bahnhof_2020_alle.csv
-- Cadence: yearly (data changes rarely)

CREATE TABLE IF NOT EXISTS transit_raw (
    id                BIGSERIAL    PRIMARY KEY,
    ags               CHAR(5)      NOT NULL,
    district_name     TEXT         NOT NULL,
    station_count     INTEGER      NOT NULL DEFAULT 0,
    has_long_distance BOOLEAN      NOT NULL DEFAULT false,
    best_category     INTEGER      NOT NULL DEFAULT 7,  -- 1=best (Berlin Hbf), 7=no station
    data_date         DATE,
    fetched_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transit_current (
    id                BIGSERIAL    PRIMARY KEY,
    ags               CHAR(5)      NOT NULL,
    district_name     TEXT         NOT NULL,
    station_count     INTEGER      NOT NULL DEFAULT 0,
    has_long_distance BOOLEAN      NOT NULL DEFAULT false,
    best_category     INTEGER      NOT NULL DEFAULT 7,
    data_date         DATE
);
CREATE UNIQUE INDEX IF NOT EXISTS transit_current_ags_idx ON transit_current (ags);
