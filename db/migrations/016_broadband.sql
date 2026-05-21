-- Bundesnetzagentur Breitbandatlas: broadband coverage by Kreis
-- Source: Bundesnetzagentur / Gigabitgrundbuch
-- Cadence: yearly

CREATE TABLE IF NOT EXISTS broadband_raw (
    id              BIGSERIAL    PRIMARY KEY,
    ags             CHAR(5)      NOT NULL,
    district_name   TEXT         NOT NULL,
    cov_100mbit     DECIMAL(5,2),   -- % households with ≥100 Mbit/s
    cov_1gbit       DECIMAL(5,2),   -- % households with ≥1 Gbit/s
    cov_fiber       DECIMAL(5,2),   -- % households with fibre (FTTH/B)
    cov_mobile_5g   DECIMAL(5,2),   -- % area with 5G coverage
    data_year       INTEGER,
    fetched_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS broadband_current (
    id              BIGSERIAL    PRIMARY KEY,
    ags             CHAR(5)      NOT NULL,
    district_name   TEXT         NOT NULL,
    cov_100mbit     DECIMAL(5,2),
    cov_1gbit       DECIMAL(5,2),
    cov_fiber       DECIMAL(5,2),
    cov_mobile_5g   DECIMAL(5,2),
    data_year       INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS broadband_current_ags_idx ON broadband_current (ags);
