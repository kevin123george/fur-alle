-- INKAR 2025: Education indicators per Kreis (BBSR)
-- Indicators: a_schul_abi (Abitur rate), a_schul_oA (dropout rate)
-- Source: BBSR – Indikatoren und Karten zur Raum- und Stadtentwicklung (INKAR 2025)
-- Cadence: yearly

CREATE TABLE IF NOT EXISTS education_current (
    id              BIGSERIAL    PRIMARY KEY,
    ags             CHAR(5)      NOT NULL,
    district_name   TEXT         NOT NULL DEFAULT '',
    abitur_rate     DECIMAL(5,2),
    dropout_rate    DECIMAL(5,2),
    data_year       INT
);
CREATE UNIQUE INDEX IF NOT EXISTS education_current_ags_idx ON education_current (ags);
