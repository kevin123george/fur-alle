CREATE TABLE IF NOT EXISTS air_quality_current (
    id           BIGSERIAL PRIMARY KEY,
    ags          VARCHAR(10)  NOT NULL,
    kreis_name   VARCHAR(255) NOT NULL,
    station_id   INTEGER      NOT NULL,
    station_name VARCHAR(255),
    pm10         NUMERIC(8,2),
    no2          NUMERIC(8,2),
    o3           NUMERIC(8,2),
    pm25         NUMERIC(8,2),
    datenstand   TIMESTAMPTZ  NOT NULL,
    fetched_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_air_quality_current_ags ON air_quality_current(ags);
