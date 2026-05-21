-- Bundesagentur für Arbeit: open job vacancies per Kreis
-- Source: same DIA API as employment · Cadence: monthly

CREATE TABLE IF NOT EXISTS vacancies_raw (
    id                 BIGSERIAL    PRIMARY KEY,
    batch_id           UUID         NOT NULL,
    ags                CHAR(5)      NOT NULL,
    kreis_name         TEXT         NOT NULL,
    offene_stellen     INTEGER,
    gemeldete_stellen  INTEGER,
    vakanzzeit         INTEGER,
    datenstand         TEXT         NOT NULL,
    fetched_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vacancies_raw_batch_idx ON vacancies_raw (batch_id);

CREATE TABLE IF NOT EXISTS vacancies_current (
    id                 BIGSERIAL    PRIMARY KEY,
    ags                CHAR(5)      NOT NULL,
    kreis_name         TEXT         NOT NULL,
    offene_stellen     INTEGER,
    gemeldete_stellen  INTEGER,
    vakanzzeit         INTEGER,
    datenstand         TEXT         NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS vacancies_current_ags_idx ON vacancies_current (ags);
