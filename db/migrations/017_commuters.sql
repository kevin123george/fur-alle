-- Bundesagentur für Arbeit Pendlerstatistik: commuter flows by Kreis
-- Source: Statistik der Bundesagentur für Arbeit
-- Cadence: yearly

CREATE TABLE IF NOT EXISTS commuters_raw (
    id                BIGSERIAL    PRIMARY KEY,
    ags               CHAR(5)      NOT NULL,
    district_name     TEXT         NOT NULL,
    commuters_in      INTEGER,
    commuters_out     INTEGER,
    commuter_balance  INTEGER,
    commuter_ratio    DECIMAL(5,2),
    data_year         INTEGER,
    fetched_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commuters_current (
    id                BIGSERIAL    PRIMARY KEY,
    ags               CHAR(5)      NOT NULL,
    district_name     TEXT         NOT NULL,
    commuters_in      INTEGER,
    commuters_out     INTEGER,
    commuter_balance  INTEGER,
    commuter_ratio    DECIMAL(5,2),
    data_year         INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS commuters_current_ags_idx ON commuters_current (ags);
