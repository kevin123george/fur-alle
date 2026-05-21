-- Regionaldatenbank Deutschland: GDP per capita by Kreis
-- Table 82111-01-05-5: Bruttoinlandsprodukt je Einwohner nach Kreisen
-- Source: Statistische Ämter des Bundes und der Länder (Regionaldatenbank)
-- Cadence: yearly

CREATE TABLE IF NOT EXISTS gdp_raw (
    id                  BIGSERIAL    PRIMARY KEY,
    ags                 CHAR(5)      NOT NULL,
    district_name       TEXT         NOT NULL,
    gdp_total_millions  DECIMAL(12,1),
    gdp_per_capita      INTEGER,
    data_year           INTEGER,
    fetched_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gdp_current (
    id                  BIGSERIAL    PRIMARY KEY,
    ags                 CHAR(5)      NOT NULL,
    district_name       TEXT         NOT NULL,
    gdp_total_millions  DECIMAL(12,1),
    gdp_per_capita      INTEGER,
    data_year           INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS gdp_current_ags_idx ON gdp_current (ags);
