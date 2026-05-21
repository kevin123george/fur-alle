-- Rename all German column names to English across all tables.
-- Idempotent: uses DO blocks to check column existence before renaming.

DO $$ BEGIN

  -- ── energy_raw / energy_current ─────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='energy_raw'     AND column_name='datenstand') THEN ALTER TABLE energy_raw     RENAME COLUMN datenstand TO data_date; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='energy_current' AND column_name='datenstand') THEN ALTER TABLE energy_current RENAME COLUMN datenstand TO data_date; END IF;

  -- ── employment_raw / employment_current ──────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employment_raw' AND column_name='kreis_name')  THEN ALTER TABLE employment_raw  RENAME COLUMN kreis_name  TO district_name; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employment_raw' AND column_name='aloquote')    THEN ALTER TABLE employment_raw  RENAME COLUMN aloquote    TO unemployment_rate; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employment_raw' AND column_name='arbeitslose') THEN ALTER TABLE employment_raw  RENAME COLUMN arbeitslose TO unemployed; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employment_raw' AND column_name='datenstand')  THEN ALTER TABLE employment_raw  RENAME COLUMN datenstand  TO data_date; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employment_current' AND column_name='kreis_name')  THEN ALTER TABLE employment_current  RENAME COLUMN kreis_name  TO district_name; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employment_current' AND column_name='aloquote')    THEN ALTER TABLE employment_current  RENAME COLUMN aloquote    TO unemployment_rate; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employment_current' AND column_name='arbeitslose') THEN ALTER TABLE employment_current  RENAME COLUMN arbeitslose TO unemployed; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employment_current' AND column_name='datenstand')  THEN ALTER TABLE employment_current  RENAME COLUMN datenstand  TO data_date; END IF;

  -- ── demographics_current ─────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demographics_current' AND column_name='kreis_name')          THEN ALTER TABLE demographics_current RENAME COLUMN kreis_name          TO district_name; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demographics_current' AND column_name='einwohner')           THEN ALTER TABLE demographics_current RENAME COLUMN einwohner           TO population; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demographics_current' AND column_name='flaeche_km2')         THEN ALTER TABLE demographics_current RENAME COLUMN flaeche_km2         TO area_km2; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demographics_current' AND column_name='bevoelkerungsdichte') THEN ALTER TABLE demographics_current RENAME COLUMN bevoelkerungsdichte TO population_density; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demographics_current' AND column_name='privathaushalte')     THEN ALTER TABLE demographics_current RENAME COLUMN privathaushalte     TO private_households; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demographics_current' AND column_name='datenstand')          THEN ALTER TABLE demographics_current RENAME COLUMN datenstand          TO data_date; END IF;

  -- ── renewables_current ───────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='renewables_current' AND column_name='kreis_name')       THEN ALTER TABLE renewables_current RENAME COLUMN kreis_name       TO district_name; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='renewables_current' AND column_name='solar_anlagen')    THEN ALTER TABLE renewables_current RENAME COLUMN solar_anlagen    TO solar_count; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='renewables_current' AND column_name='wind_anlagen')     THEN ALTER TABLE renewables_current RENAME COLUMN wind_anlagen     TO wind_count; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='renewables_current' AND column_name='biomasse_anlagen') THEN ALTER TABLE renewables_current RENAME COLUMN biomasse_anlagen TO biomass_count; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='renewables_current' AND column_name='biomasse_kw')      THEN ALTER TABLE renewables_current RENAME COLUMN biomasse_kw      TO biomass_kw; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='renewables_current' AND column_name='ev_ladepunkte')    THEN ALTER TABLE renewables_current RENAME COLUMN ev_ladepunkte    TO ev_chargers; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='renewables_current' AND column_name='datenstand')       THEN ALTER TABLE renewables_current RENAME COLUMN datenstand       TO data_date; END IF;

  -- ── election_current / wahlkreis_ags_map ─────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='election_current' AND column_name='wahlkreis_nr')    THEN ALTER TABLE election_current RENAME COLUMN wahlkreis_nr    TO constituency_nr; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='election_current' AND column_name='wahlkreis_name')  THEN ALTER TABLE election_current RENAME COLUMN wahlkreis_name  TO constituency_name; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='election_current' AND column_name='wahl_jahr')       THEN ALTER TABLE election_current RENAME COLUMN wahl_jahr        TO election_year; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='election_current' AND column_name='wahlbeteiligung') THEN ALTER TABLE election_current RENAME COLUMN wahlbeteiligung  TO turnout; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='election_current' AND column_name='gruene')          THEN ALTER TABLE election_current RENAME COLUMN gruene           TO greens; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='election_current' AND column_name='linke')           THEN ALTER TABLE election_current RENAME COLUMN linke            TO left_party; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='election_current' AND column_name='sonstige')        THEN ALTER TABLE election_current RENAME COLUMN sonstige         TO other; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='election_current' AND column_name='datenstand')      THEN ALTER TABLE election_current RENAME COLUMN datenstand       TO data_date; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wahlkreis_ags_map' AND column_name='wahlkreis_nr') THEN ALTER TABLE wahlkreis_ags_map RENAME COLUMN wahlkreis_nr TO constituency_nr; END IF;

  -- ── vehicles_current ─────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles_current' AND column_name='kreis_name')     THEN ALTER TABLE vehicles_current RENAME COLUMN kreis_name     TO district_name; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles_current' AND column_name='pkw_gesamt')     THEN ALTER TABLE vehicles_current RENAME COLUMN pkw_gesamt     TO cars_total; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles_current' AND column_name='pkw_je_1000_ew') THEN ALTER TABLE vehicles_current RENAME COLUMN pkw_je_1000_ew TO cars_per_1000; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles_current' AND column_name='elektro')        THEN ALTER TABLE vehicles_current RENAME COLUMN elektro        TO electric; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles_current' AND column_name='elektro_anteil') THEN ALTER TABLE vehicles_current RENAME COLUMN elektro_anteil TO electric_share; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles_current' AND column_name='hybrid_anteil')  THEN ALTER TABLE vehicles_current RENAME COLUMN hybrid_anteil  TO hybrid_share; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles_current' AND column_name='datenstand')     THEN ALTER TABLE vehicles_current RENAME COLUMN datenstand     TO data_date; END IF;

  -- ── vacancies_raw / vacancies_current ────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacancies_raw' AND column_name='kreis_name')        THEN ALTER TABLE vacancies_raw RENAME COLUMN kreis_name        TO district_name; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacancies_raw' AND column_name='offene_stellen')    THEN ALTER TABLE vacancies_raw RENAME COLUMN offene_stellen    TO open_positions; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacancies_raw' AND column_name='gemeldete_stellen') THEN ALTER TABLE vacancies_raw RENAME COLUMN gemeldete_stellen TO reported_positions; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacancies_raw' AND column_name='vakanzzeit')        THEN ALTER TABLE vacancies_raw RENAME COLUMN vakanzzeit        TO avg_vacancy_days; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacancies_raw' AND column_name='datenstand')        THEN ALTER TABLE vacancies_raw RENAME COLUMN datenstand        TO data_date; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacancies_current' AND column_name='kreis_name')        THEN ALTER TABLE vacancies_current RENAME COLUMN kreis_name        TO district_name; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacancies_current' AND column_name='offene_stellen')    THEN ALTER TABLE vacancies_current RENAME COLUMN offene_stellen    TO open_positions; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacancies_current' AND column_name='gemeldete_stellen') THEN ALTER TABLE vacancies_current RENAME COLUMN gemeldete_stellen TO reported_positions; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacancies_current' AND column_name='vakanzzeit')        THEN ALTER TABLE vacancies_current RENAME COLUMN vakanzzeit        TO avg_vacancy_days; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacancies_current' AND column_name='datenstand')        THEN ALTER TABLE vacancies_current RENAME COLUMN datenstand        TO data_date; END IF;

  -- ── weather_current ──────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='weather_current' AND column_name='kreis_name') THEN ALTER TABLE weather_current RENAME COLUMN kreis_name TO district_name; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='weather_current' AND column_name='datenstand') THEN ALTER TABLE weather_current RENAME COLUMN datenstand  TO data_date; END IF;

  -- ── air_quality_current ──────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='air_quality_current' AND column_name='kreis_name') THEN ALTER TABLE air_quality_current RENAME COLUMN kreis_name TO district_name; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='air_quality_current' AND column_name='datenstand') THEN ALTER TABLE air_quality_current RENAME COLUMN datenstand  TO data_date; END IF;

  -- ── kreis_requests ────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kreis_requests' AND column_name='bundesland') THEN ALTER TABLE kreis_requests RENAME COLUMN bundesland TO state; END IF;

END $$;

-- Unique index on election_current using final (English) column names.
-- Placed here rather than 009 so it runs after the column rename.
CREATE UNIQUE INDEX IF NOT EXISTS election_current_wk_year_idx
    ON election_current (constituency_nr, election_year);
