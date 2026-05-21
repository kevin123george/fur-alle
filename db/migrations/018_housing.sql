-- BBSR Wohnungsmarktdaten: housing market indicators by Kreis
-- Source: Bundesinstitut für Bau-, Stadt- und Raumforschung (BBSR)
-- Cadence: yearly

CREATE TABLE IF NOT EXISTS housing_raw (
    id              BIGSERIAL    PRIMARY KEY,
    ags             CHAR(5)      NOT NULL,
    district_name   TEXT         NOT NULL,
    rent_per_sqm    DECIMAL(6,2),   -- Angebotsmiete €/m²
    vacancy_rate    DECIMAL(5,2),   -- Leerstandsquote %
    data_year       INTEGER,
    fetched_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS housing_current (
    id              BIGSERIAL    PRIMARY KEY,
    ags             CHAR(5)      NOT NULL,
    district_name   TEXT         NOT NULL,
    rent_per_sqm    DECIMAL(6,2),
    vacancy_rate    DECIMAL(5,2),
    data_year       INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS housing_current_ags_idx ON housing_current (ags);
