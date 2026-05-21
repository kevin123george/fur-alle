-- INKAR 2025: Social indicators per Kreis (BBSR)
-- Indicators: m_ek (income), q_newfBGu15_bev (child poverty), a_GSa (old-age poverty), q_straf (crime rate)
-- Source: BBSR – Indikatoren und Karten zur Raum- und Stadtentwicklung (INKAR 2025)
-- Cadence: yearly

CREATE TABLE IF NOT EXISTS social_current (
    id                  BIGSERIAL    PRIMARY KEY,
    ags                 CHAR(5)      NOT NULL,
    district_name       TEXT         NOT NULL DEFAULT '',
    income_monthly_eur  DECIMAL(8,2),
    child_poverty_pct   DECIMAL(5,2),
    old_age_poverty_pct DECIMAL(5,2),
    crime_rate_per_100k DECIMAL(8,2),
    data_year           INT
);
CREATE UNIQUE INDEX IF NOT EXISTS social_current_ags_idx ON social_current (ags);
