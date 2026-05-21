-- Regionaldatenbank Deutschland: natural population change by Kreis
-- Table 12611-01-04-4: births and deaths per Kreis
-- Source: Statistische Ämter des Bundes und der Länder (Regionaldatenbank)
-- Cadence: yearly

CREATE TABLE IF NOT EXISTS natural_population_raw (
    id              BIGSERIAL    PRIMARY KEY,
    ags             CHAR(5)      NOT NULL,
    district_name   TEXT         NOT NULL,
    births          INTEGER,
    deaths          INTEGER,
    natural_change  INTEGER,
    birth_rate      DECIMAL(6,2),
    death_rate      DECIMAL(6,2),
    data_year       INTEGER,
    fetched_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS natural_population_current (
    id              BIGSERIAL    PRIMARY KEY,
    ags             CHAR(5)      NOT NULL,
    district_name   TEXT         NOT NULL,
    births          INTEGER,
    deaths          INTEGER,
    natural_change  INTEGER,
    birth_rate      DECIMAL(6,2),
    death_rate      DECIMAL(6,2),
    data_year       INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS natural_population_current_ags_idx
    ON natural_population_current (ags);
