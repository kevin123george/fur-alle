CREATE TABLE IF NOT EXISTS employment_raw (
    id            BIGSERIAL PRIMARY KEY,
    batch_id      UUID        NOT NULL,
    ags           CHAR(5)     NOT NULL,
    kreis_name    TEXT        NOT NULL,
    aloquote      NUMERIC(5,2),
    arbeitslose   INTEGER,
    datenstand    TEXT        NOT NULL,
    fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS employment_raw_batch_idx ON employment_raw (batch_id);

CREATE TABLE IF NOT EXISTS employment_current (
    id            BIGSERIAL PRIMARY KEY,
    ags           CHAR(5)     NOT NULL,
    kreis_name    TEXT        NOT NULL,
    aloquote      NUMERIC(5,2),
    arbeitslose   INTEGER,
    datenstand    TEXT        NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS employment_current_ags_idx ON employment_current (ags);
