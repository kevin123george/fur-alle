-- INKAR 2025: Electric vehicle indicators per Kreis (BBSR)
-- Indicators: a_elektro (EV share %), q_ladepunkte (chargers per 10k residents)
-- Source: BBSR – Indikatoren und Karten zur Raum- und Stadtentwicklung (INKAR 2025)
-- Cadence: yearly

CREATE TABLE IF NOT EXISTS ev_current (
    id                  BIGSERIAL    PRIMARY KEY,
    ags                 CHAR(5)      NOT NULL,
    district_name       TEXT         NOT NULL DEFAULT '',
    ev_share_pct        DECIMAL(5,2),
    chargers_per_10k    DECIMAL(6,2),
    data_year           INT
);
CREATE UNIQUE INDEX IF NOT EXISTS ev_current_ags_idx ON ev_current (ags);
