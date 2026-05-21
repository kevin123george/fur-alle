-- INKAR 2025: Accessibility / distance indicators per Kreis (BBSR)
-- Indicators: m_G02_SUP_DIST (supermarket), m_Q01_APO_DIST (pharmacy), m_OEV20_DIST (transit stop)
-- Source: BBSR – Indikatoren und Karten zur Raum- und Stadtentwicklung (INKAR 2025)
-- Cadence: yearly

CREATE TABLE IF NOT EXISTS accessibility_current (
    id                   BIGSERIAL    PRIMARY KEY,
    ags                  CHAR(5)      NOT NULL,
    district_name        TEXT         NOT NULL DEFAULT '',
    dist_supermarket_m   INT,
    dist_pharmacy_m      INT,
    dist_transit_stop_m  INT,
    data_year            INT
);
CREATE UNIQUE INDEX IF NOT EXISTS accessibility_current_ags_idx ON accessibility_current (ags);
