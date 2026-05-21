-- INKAR 2025: Population dynamics per Kreis (BBSR)
-- Indicators: m_bev_alter (avg age), a_bev65um (share 65+), i_wans (net migration),
--             i_wans_b_1825 (youth migration), e_bev2230_rop45 (population projection 2030)
-- Source: BBSR – Indikatoren und Karten zur Raum- und Stadtentwicklung (INKAR 2025)
-- Cadence: yearly

CREATE TABLE IF NOT EXISTS population_dynamics_current (
    id                        BIGSERIAL    PRIMARY KEY,
    ags                       CHAR(5)      NOT NULL,
    district_name             TEXT         NOT NULL DEFAULT '',
    avg_age                   DECIMAL(4,1),
    share_65plus              DECIMAL(5,2),
    net_migration_per_1000    DECIMAL(6,2),
    youth_migration_per_1000  DECIMAL(6,2),
    pop_projection_2030_pct   DECIMAL(6,2),
    data_year                 INT
);
CREATE UNIQUE INDEX IF NOT EXISTS population_dynamics_current_ags_idx ON population_dynamics_current (ags);
