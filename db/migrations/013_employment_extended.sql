-- Bundesagentur für Arbeit: extended employment metrics per Kreis
-- Metrics: Langzeitarbeitslosenquote, Jugendarbeitslosenquote,
--          Ältere Arbeitslosenquote, SGB-II-Quote
-- Source: same DIA API as employment  · Cadence: monthly

CREATE TABLE IF NOT EXISTS employment_extended_raw (
    id              BIGSERIAL    PRIMARY KEY,
    batch_id        UUID         NOT NULL,
    ags             CHAR(5)      NOT NULL,
    district_name   TEXT         NOT NULL,
    alq_long_term   DECIMAL(4,1),
    alq_youth       DECIMAL(4,1),
    alq_older       DECIMAL(4,1),
    sgb2_rate       DECIMAL(4,1),
    data_date       TEXT         NOT NULL DEFAULT '',
    fetched_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS employment_extended_raw_batch_idx
    ON employment_extended_raw (batch_id);

CREATE TABLE IF NOT EXISTS employment_extended_current (
    id              BIGSERIAL    PRIMARY KEY,
    ags             CHAR(5)      NOT NULL,
    district_name   TEXT         NOT NULL,
    alq_long_term   DECIMAL(4,1),
    alq_youth       DECIMAL(4,1),
    alq_older       DECIMAL(4,1),
    sgb2_rate       DECIMAL(4,1),
    data_date       TEXT         NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS employment_extended_current_ags_idx
    ON employment_extended_current (ags);
