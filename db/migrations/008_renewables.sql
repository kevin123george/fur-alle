-- Marktstammdatenregister (MaStR): renewable energy installations per Kreis
-- Source: MaStR OData API · Cadence: weekly

CREATE TABLE IF NOT EXISTS renewables_current (
    id               BIGSERIAL    PRIMARY KEY,
    ags              CHAR(5)      NOT NULL,
    kreis_name       TEXT         NOT NULL,
    solar_anlagen    INTEGER      DEFAULT 0,
    solar_kwp        NUMERIC(15,2) DEFAULT 0,
    wind_anlagen     INTEGER      DEFAULT 0,
    wind_kw          NUMERIC(15,2) DEFAULT 0,
    biomasse_anlagen INTEGER      DEFAULT 0,
    biomasse_kw      NUMERIC(15,2) DEFAULT 0,
    ev_ladepunkte    INTEGER      DEFAULT 0,
    datenstand       DATE,
    fetched_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS renewables_current_ags_idx ON renewables_current (ags);
