CREATE TABLE IF NOT EXISTS fuel_prices_current (
    id             BIGSERIAL PRIMARY KEY,
    ags            TEXT          NOT NULL UNIQUE,
    district_name  TEXT          NOT NULL,
    e5_avg         NUMERIC(5,3),
    e10_avg        NUMERIC(5,3),
    diesel_avg     NUMERIC(5,3),
    station_count  INT,
    fetched_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);
