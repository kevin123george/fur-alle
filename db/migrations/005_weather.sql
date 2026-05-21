CREATE TABLE IF NOT EXISTS weather_current (
    id          BIGSERIAL PRIMARY KEY,
    ags         VARCHAR(10)  NOT NULL,
    kreis_name  VARCHAR(255) NOT NULL,
    temperature NUMERIC(5,2),
    wind_speed  NUMERIC(6,2),
    precipitation NUMERIC(6,2),
    condition   VARCHAR(100),
    cloud_cover SMALLINT,
    humidity    SMALLINT,
    datenstand  TIMESTAMPTZ  NOT NULL,
    fetched_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_weather_current_ags ON weather_current(ags);
