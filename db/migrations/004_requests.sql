CREATE TABLE IF NOT EXISTS kreis_requests (
    id           BIGSERIAL PRIMARY KEY,
    ags          CHAR(5)  NOT NULL,
    kreis_name   TEXT     NOT NULL,
    bundesland   TEXT     NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (ags)
);
