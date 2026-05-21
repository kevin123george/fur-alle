CREATE TABLE IF NOT EXISTS energy_raw (
    id            BIGSERIAL PRIMARY KEY,
    batch_id      UUID        NOT NULL,
    filter_code   INTEGER     NOT NULL,
    ts_utc        TIMESTAMPTZ NOT NULL,
    mwh_quarter   NUMERIC(12,2),
    datenstand    DATE        NOT NULL,
    fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS energy_raw_batch_idx ON energy_raw (batch_id);
CREATE INDEX IF NOT EXISTS energy_raw_filter_ts_idx ON energy_raw (filter_code, ts_utc);

CREATE TABLE IF NOT EXISTS energy_current (
    id            BIGSERIAL PRIMARY KEY,
    filter_code   INTEGER     NOT NULL,
    ts_utc        TIMESTAMPTZ NOT NULL,
    mwh_quarter   NUMERIC(12,2),
    mw_instant    NUMERIC(12,2) GENERATED ALWAYS AS (mwh_quarter * 4) STORED,
    datenstand    DATE        NOT NULL
);
CREATE INDEX IF NOT EXISTS energy_current_filter_ts_idx ON energy_current (filter_code, ts_utc DESC);
