-- Kraftfahrtbundesamt (KBA): vehicle registrations per Kreis
-- Source: fz3 CSV series · Cadence: quarterly

CREATE TABLE IF NOT EXISTS vehicles_current (
    id              BIGSERIAL    PRIMARY KEY,
    ags             CHAR(5)      NOT NULL,
    kreis_name      TEXT         NOT NULL,
    pkw_gesamt      INTEGER,
    pkw_je_1000_ew  NUMERIC(8,1),
    elektro         INTEGER,
    elektro_anteil  NUMERIC(5,2),
    hybrid          INTEGER,
    hybrid_anteil   NUMERIC(5,2),
    datenstand      DATE,
    fetched_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_current_ags_idx ON vehicles_current (ags);
