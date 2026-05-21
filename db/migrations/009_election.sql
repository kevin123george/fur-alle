-- Bundeswahlleiter: Bundestagswahl results at Wahlkreis level
-- Source: kerg2.csv · Cadence: per election (manual run)
-- Note: Wahlkreise do not align exactly with Kreisgrenzen — see wahlkreis_ags.json

CREATE TABLE IF NOT EXISTS election_current (
    id               BIGSERIAL    PRIMARY KEY,
    wahlkreis_nr     INTEGER      NOT NULL,
    wahlkreis_name   TEXT         NOT NULL,
    wahl_jahr        INTEGER      NOT NULL,
    wahlbeteiligung  NUMERIC(5,2),
    spd              NUMERIC(5,2),
    cdu_csu          NUMERIC(5,2),
    gruene           NUMERIC(5,2),
    fdp              NUMERIC(5,2),
    afd              NUMERIC(5,2),
    linke            NUMERIC(5,2),
    sonstige         NUMERIC(5,2),
    datenstand       DATE,
    fetched_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
-- unique index created in 012_rename_to_english.sql after column rename

-- Mapping Wahlkreis → AGS (many-to-many; populated from data/static/wahlkreis_ags.json)
CREATE TABLE IF NOT EXISTS wahlkreis_ags_map (
    wahlkreis_nr  INTEGER  NOT NULL,
    ags           CHAR(5)  NOT NULL,
    PRIMARY KEY (wahlkreis_nr, ags)
);
CREATE INDEX IF NOT EXISTS wahlkreis_ags_map_ags_idx ON wahlkreis_ags_map (ags);
