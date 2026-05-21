-- Regionaldatenbank Deutschland: healthcare density by Kreis
-- Table 23111-02-02-4: doctors per 100k population
-- Table 23631-01-01-4: hospital beds per 100k population
-- Source: Statistische Ämter des Bundes und der Länder (Regionaldatenbank)
-- Cadence: yearly

CREATE TABLE IF NOT EXISTS healthcare_raw (
    id                        BIGSERIAL    PRIMARY KEY,
    ags                       CHAR(5)      NOT NULL,
    district_name             TEXT         NOT NULL,
    doctors_per_100k          DECIMAL(7,1),
    hospital_beds_per_100k    DECIMAL(7,1),
    data_year                 INTEGER,
    fetched_at                TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS healthcare_current (
    id                        BIGSERIAL    PRIMARY KEY,
    ags                       CHAR(5)      NOT NULL,
    district_name             TEXT         NOT NULL,
    doctors_per_100k          DECIMAL(7,1),
    hospital_beds_per_100k    DECIMAL(7,1),
    data_year                 INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS healthcare_current_ags_idx ON healthcare_current (ags);
