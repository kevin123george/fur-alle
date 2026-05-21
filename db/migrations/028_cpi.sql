CREATE TABLE IF NOT EXISTS cpi_raw (
    id          BIGSERIAL PRIMARY KEY,
    batch_id    UUID        NOT NULL,
    category    TEXT        NOT NULL,
    year_month  DATE        NOT NULL,
    yoy_pct     NUMERIC(6,2),
    fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cpi_raw_batch_idx ON cpi_raw (batch_id);

CREATE TABLE IF NOT EXISTS cpi_current (
    id          BIGSERIAL PRIMARY KEY,
    category    TEXT        NOT NULL,
    year_month  DATE        NOT NULL,
    yoy_pct     NUMERIC(6,2),
    fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS cpi_current_cat_month_idx ON cpi_current (category, year_month);
