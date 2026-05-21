-- Zensus 2022 / Destatis GENESIS: population, area, density per Kreis
-- Source: table 12411-03-03-5-B · Cadence: yearly
-- No raw/staging table — static yearly data upserted directly

CREATE TABLE IF NOT EXISTS demographics_current (
    id                  BIGSERIAL    PRIMARY KEY,
    ags                 CHAR(5)      NOT NULL,
    kreis_name          TEXT         NOT NULL,
    einwohner           INTEGER,
    flaeche_km2         NUMERIC(10,2),
    bevoelkerungsdichte NUMERIC(8,1),
    privathaushalte     INTEGER,
    datenstand          DATE,
    fetched_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS demographics_current_ags_idx ON demographics_current (ags);
