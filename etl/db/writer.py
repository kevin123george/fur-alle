import logging
import os

import psycopg
from psycopg.rows import dict_row

from models.schemas import (
    AccessibilityRaw,
    AirQualityRaw,
    BroadbandRaw,
    CommutersRaw,
    DemographicsRaw,
    ElectionRow,
    EmploymentExtendedRaw,
    EnergyRaw,
    EmploymentRaw,
    EvRaw,
    EducationRaw,
    GdpRaw,
    HealthcareRaw,
    HousingRaw,
    NatPopRaw,
    PopulationDynamicsRaw,
    RenewablesRaw,
    SocialRaw,
    TransitRaw,
    VacanciesRaw,
    VehiclesRaw,
    WeatherRaw,
)

logger = logging.getLogger(__name__)


def _get_dsn() -> str:
    return os.getenv("DB_DSN", "host=localhost dbname=fueralle user=astra")


def write_energy_batch(rows: list[EnergyRaw]) -> None:
    if not rows:
        logger.warning("write_energy_batch called with empty rows list")
        return

    batch_id = rows[0].batch_id
    logger.info("Writing energy batch %s (%d rows) to staging", batch_id, len(rows))

    with psycopg.connect(_get_dsn()) as conn:
        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO energy_raw (batch_id, filter_code, ts_utc, mwh_quarter, data_date)
                VALUES (%s, %s, %s, %s, %s)
                """,
                [
                    (str(r.batch_id), r.filter_code, r.ts_utc, r.mwh_quarter, r.data_date)
                    for r in rows
                ],
            )
        conn.commit()

    logger.info("Promoting energy batch %s to current", batch_id)
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute("TRUNCATE energy_current")
                cur.execute(
                    """
                    INSERT INTO energy_current (filter_code, ts_utc, mwh_quarter, data_date, fetched_at)
                    SELECT filter_code, ts_utc, mwh_quarter, data_date, now()
                    FROM energy_raw
                    WHERE batch_id = %s
                    """,
                    (str(batch_id),),
                )
                cur.execute("SELECT count(*) FROM energy_current")
                count = cur.fetchone()[0]

    logger.info("energy_current now has %d rows", count)


def write_employment_batch(rows: list[EmploymentRaw]) -> None:
    if not rows:
        logger.warning("write_employment_batch called with empty rows list")
        return

    batch_id = rows[0].batch_id
    logger.info("Writing employment batch %s (%d rows) to staging", batch_id, len(rows))

    with psycopg.connect(_get_dsn()) as conn:
        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO employment_raw (batch_id, ags, district_name, unemployment_rate, unemployed, data_date)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                [
                    (str(r.batch_id), r.ags, r.district_name, r.unemployment_rate, r.unemployed, r.data_date)
                    for r in rows
                ],
            )
        conn.commit()

    logger.info("Promoting employment batch %s to current", batch_id)
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute("TRUNCATE employment_current")
                cur.execute(
                    """
                    INSERT INTO employment_current (ags, district_name, unemployment_rate, unemployed, data_date, fetched_at)
                    SELECT ags, district_name, unemployment_rate, unemployed, data_date, now()
                    FROM employment_raw
                    WHERE batch_id = %s
                    """,
                    (str(batch_id),),
                )
                cur.execute("SELECT count(*) FROM employment_current")
                count = cur.fetchone()[0]

    logger.info("employment_current now has %d rows", count)


def write_weather_batch(rows: list[WeatherRaw]) -> None:
    if not rows:
        logger.warning("write_weather_batch called with empty rows list")
        return

    logger.info("Upserting %d weather rows into weather_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO weather_current
                        (ags, district_name, temperature, wind_speed, precipitation,
                         condition, cloud_cover, humidity, data_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name = EXCLUDED.district_name,
                        temperature   = EXCLUDED.temperature,
                        wind_speed    = EXCLUDED.wind_speed,
                        precipitation = EXCLUDED.precipitation,
                        condition     = EXCLUDED.condition,
                        cloud_cover   = EXCLUDED.cloud_cover,
                        humidity      = EXCLUDED.humidity,
                        data_date     = EXCLUDED.data_date,
                        fetched_at    = now()
                    """,
                    [
                        (r.ags, r.district_name, r.temperature, r.wind_speed, r.precipitation,
                         r.condition, r.cloud_cover, r.humidity, r.data_date)
                        for r in rows
                    ],
                )
                cur.execute("SELECT count(*) FROM weather_current")
                count = cur.fetchone()[0]

    logger.info("weather_current now has %d rows", count)


def write_air_quality_batch(rows: list[AirQualityRaw]) -> None:
    if not rows:
        logger.warning("write_air_quality_batch called with empty rows list")
        return

    logger.info("Upserting %d air quality rows into air_quality_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO air_quality_current
                        (ags, district_name, station_id, station_name, pm10, no2, o3, pm25, data_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name = EXCLUDED.district_name,
                        station_id   = EXCLUDED.station_id,
                        station_name = EXCLUDED.station_name,
                        pm10         = EXCLUDED.pm10,
                        no2          = EXCLUDED.no2,
                        o3           = EXCLUDED.o3,
                        pm25         = EXCLUDED.pm25,
                        data_date    = EXCLUDED.data_date,
                        fetched_at   = now()
                    """,
                    [
                        (r.ags, r.district_name, r.station_id, r.station_name,
                         r.pm10, r.no2, r.o3, r.pm25, r.data_date)
                        for r in rows
                    ],
                )
                cur.execute("SELECT count(*) FROM air_quality_current")
                count = cur.fetchone()[0]

    logger.info("air_quality_current now has %d rows", count)


def write_demographics_batch(rows: list[DemographicsRaw]) -> None:
    if not rows:
        logger.warning("write_demographics_batch called with empty rows list")
        return

    logger.info("Upserting %d demographics rows into demographics_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO demographics_current
                        (ags, district_name, population, area_km2, population_density,
                         private_households, data_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name      = EXCLUDED.district_name,
                        population         = EXCLUDED.population,
                        area_km2           = EXCLUDED.area_km2,
                        population_density = EXCLUDED.population_density,
                        private_households = EXCLUDED.private_households,
                        data_date          = EXCLUDED.data_date,
                        fetched_at         = now()
                    """,
                    [
                        (
                            r.ags, r.district_name, r.population, r.area_km2,
                            r.population_density, r.private_households, r.data_date,
                        )
                        for r in rows
                    ],
                )
                cur.execute("SELECT count(*) FROM demographics_current")
                count = cur.fetchone()[0]

    logger.info("demographics_current now has %d rows", count)


def write_renewables_batch(rows: list[RenewablesRaw]) -> None:
    if not rows:
        logger.warning("write_renewables_batch called with empty rows list")
        return

    logger.info("Upserting %d renewables rows into renewables_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO renewables_current
                        (ags, district_name, solar_count, solar_kwp, wind_count, wind_kw,
                         biomass_count, biomass_kw, ev_chargers, data_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name = CASE
                            WHEN EXCLUDED.district_name != '' THEN EXCLUDED.district_name
                            ELSE renewables_current.district_name
                        END,
                        solar_count   = EXCLUDED.solar_count,
                        solar_kwp     = EXCLUDED.solar_kwp,
                        wind_count    = EXCLUDED.wind_count,
                        wind_kw       = EXCLUDED.wind_kw,
                        biomass_count = EXCLUDED.biomass_count,
                        biomass_kw    = EXCLUDED.biomass_kw,
                        ev_chargers   = EXCLUDED.ev_chargers,
                        data_date     = EXCLUDED.data_date,
                        fetched_at    = now()
                    """,
                    [
                        (
                            r.ags, r.district_name, r.solar_count, r.solar_kwp,
                            r.wind_count, r.wind_kw, r.biomass_count, r.biomass_kw,
                            r.ev_chargers, r.data_date,
                        )
                        for r in rows
                    ],
                )
                # Backfill district_name from employment_current where still blank
                cur.execute("""
                    UPDATE renewables_current r
                       SET district_name = e.district_name
                      FROM employment_current e
                     WHERE r.ags = e.ags
                       AND (r.district_name = '' OR r.district_name IS NULL)
                """)
                logger.info("MaStR: backfilled district_name for %d rows", cur.rowcount)
                cur.execute("SELECT count(*) FROM renewables_current")
                count = cur.fetchone()[0]

    logger.info("renewables_current now has %d rows", count)


def write_election_batch(rows: list[ElectionRow], ags_map: dict[int, list[str]]) -> None:
    """Upsert election results and repopulate the wahlkreis_ags_map join table."""
    if not rows:
        logger.warning("write_election_batch called with empty rows list")
        return

    logger.info("Upserting %d election rows into election_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                # Upsert election results
                cur.executemany(
                    """
                    INSERT INTO election_current
                        (constituency_nr, constituency_name, election_year, turnout,
                         spd, cdu_csu, greens, fdp, afd, left_party, other, data_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (constituency_nr, election_year) DO UPDATE SET
                        constituency_name = EXCLUDED.constituency_name,
                        turnout           = EXCLUDED.turnout,
                        spd               = EXCLUDED.spd,
                        cdu_csu           = EXCLUDED.cdu_csu,
                        greens            = EXCLUDED.greens,
                        fdp               = EXCLUDED.fdp,
                        afd               = EXCLUDED.afd,
                        left_party        = EXCLUDED.left_party,
                        other             = EXCLUDED.other,
                        data_date         = EXCLUDED.data_date,
                        fetched_at        = now()
                    """,
                    [
                        (
                            r.constituency_nr, r.constituency_name, r.election_year,
                            r.turnout, r.spd, r.cdu_csu, r.greens,
                            r.fdp, r.afd, r.left_party, r.other, r.data_date,
                        )
                        for r in rows
                    ],
                )

                # Repopulate wahlkreis_ags_map for the Wahlkreise we just upserted
                if ags_map:
                    constituency_nrs = [r.constituency_nr for r in rows]
                    cur.execute(
                        "DELETE FROM wahlkreis_ags_map WHERE constituency_nr = ANY(%s)",
                        (constituency_nrs,),
                    )
                    ags_rows: list[tuple[int, str]] = []
                    for nr, ags_list in ags_map.items():
                        for ags in ags_list:
                            ags_rows.append((nr, ags))
                    if ags_rows:
                        cur.executemany(
                            "INSERT INTO wahlkreis_ags_map (constituency_nr, ags) VALUES (%s, %s)",
                            ags_rows,
                        )
                        logger.info(
                            "wahlkreis_ags_map: inserted %d rows for %d Wahlkreise",
                            len(ags_rows), len(ags_map),
                        )

                cur.execute("SELECT count(*) FROM election_current")
                count = cur.fetchone()[0]

    logger.info("election_current now has %d rows", count)


def write_vehicles_batch(rows: list[VehiclesRaw]) -> None:
    if not rows:
        logger.warning("write_vehicles_batch called with empty rows list")
        return

    logger.info("Upserting %d vehicle rows into vehicles_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO vehicles_current
                        (ags, district_name, cars_total, cars_per_1000,
                         electric, electric_share, hybrid, hybrid_share, data_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name  = EXCLUDED.district_name,
                        cars_total     = EXCLUDED.cars_total,
                        cars_per_1000  = EXCLUDED.cars_per_1000,
                        electric       = EXCLUDED.electric,
                        electric_share = EXCLUDED.electric_share,
                        hybrid         = EXCLUDED.hybrid,
                        hybrid_share   = EXCLUDED.hybrid_share,
                        data_date      = EXCLUDED.data_date,
                        fetched_at     = now()
                    """,
                    [
                        (
                            r.ags, r.district_name, r.cars_total, r.cars_per_1000,
                            r.electric, r.electric_share, r.hybrid, r.hybrid_share,
                            r.data_date,
                        )
                        for r in rows
                    ],
                )
                # Derive cars_per_1000 from demographics where not already set
                cur.execute("""
                    UPDATE vehicles_current v
                       SET cars_per_1000 = ROUND(v.cars_total::numeric / d.population * 1000)
                      FROM demographics_current d
                     WHERE v.ags = d.ags
                       AND v.cars_per_1000 IS NULL
                       AND v.cars_total IS NOT NULL
                       AND d.population > 0
                """)
                logger.info("KBA: computed cars_per_1000 for %d rows via demographics", cur.rowcount)
                cur.execute("SELECT count(*) FROM vehicles_current")
                count = cur.fetchone()[0]

    logger.info("vehicles_current now has %d rows", count)


def write_vacancies_batch(rows: list[VacanciesRaw]) -> None:
    """Same staging→current promotion pattern as write_employment_batch."""
    if not rows:
        logger.warning("write_vacancies_batch called with empty rows list")
        return

    batch_id = rows[0].batch_id
    logger.info("Writing vacancies batch %s (%d rows) to staging", batch_id, len(rows))

    with psycopg.connect(_get_dsn()) as conn:
        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO vacancies_raw
                    (batch_id, ags, district_name, open_positions, reported_positions,
                     avg_vacancy_days, data_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                [
                    (
                        str(r.batch_id), r.ags, r.district_name,
                        r.open_positions, r.reported_positions, r.avg_vacancy_days, r.data_date,
                    )
                    for r in rows
                ],
            )
        conn.commit()

    logger.info("Promoting vacancies batch %s to current", batch_id)
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute("TRUNCATE vacancies_current")
                cur.execute(
                    """
                    INSERT INTO vacancies_current
                        (ags, district_name, open_positions, reported_positions,
                         avg_vacancy_days, data_date, fetched_at)
                    SELECT ags, district_name, open_positions, reported_positions,
                           avg_vacancy_days, data_date, now()
                    FROM vacancies_raw
                    WHERE batch_id = %s
                    """,
                    (str(batch_id),),
                )
                cur.execute("SELECT count(*) FROM vacancies_current")
                count = cur.fetchone()[0]

    logger.info("vacancies_current now has %d rows", count)


# ---------------------------------------------------------------------------
# New sources — Phase 2+
# ---------------------------------------------------------------------------


def write_employment_extended_batch(rows: list[EmploymentExtendedRaw]) -> None:
    """Staging → current promotion pattern (same as write_employment_batch)."""
    if not rows:
        logger.warning("write_employment_extended_batch called with empty rows list")
        return

    batch_id = rows[0].batch_id
    logger.info(
        "Writing employment_extended batch %s (%d rows) to staging", batch_id, len(rows)
    )

    with psycopg.connect(_get_dsn()) as conn:
        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO employment_extended_raw
                    (batch_id, ags, district_name, alq_long_term, alq_youth,
                     alq_older, sgb2_rate, data_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                [
                    (
                        str(r.batch_id), r.ags, r.district_name,
                        r.alq_long_term, r.alq_youth, r.alq_older,
                        r.sgb2_rate, r.data_date,
                    )
                    for r in rows
                ],
            )
        conn.commit()

    logger.info("Promoting employment_extended batch %s to current", batch_id)
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute("TRUNCATE employment_extended_current")
                cur.execute(
                    """
                    INSERT INTO employment_extended_current
                        (ags, district_name, alq_long_term, alq_youth,
                         alq_older, sgb2_rate, data_date, fetched_at)
                    SELECT ags, district_name, alq_long_term, alq_youth,
                           alq_older, sgb2_rate, data_date, now()
                    FROM employment_extended_raw
                    WHERE batch_id = %s
                    """,
                    (str(batch_id),),
                )
                cur.execute("""
                    UPDATE employment_extended_current t SET district_name = e.district_name
                      FROM employment_current e
                     WHERE t.ags = e.ags AND (t.district_name = '' OR t.district_name IS NULL)
                """)
                cur.execute("SELECT count(*) FROM employment_extended_current")
                count = cur.fetchone()[0]

    logger.info("employment_extended_current now has %d rows", count)


def write_natpop_batch(rows: list[NatPopRaw]) -> None:
    if not rows:
        logger.warning("write_natpop_batch called with empty rows list")
        return

    logger.info("Upserting %d natural_population rows into natural_population_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO natural_population_current
                        (ags, district_name, births, deaths, natural_change,
                         birth_rate, death_rate, data_year, fetched_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, now())
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name  = EXCLUDED.district_name,
                        births         = EXCLUDED.births,
                        deaths         = EXCLUDED.deaths,
                        natural_change = EXCLUDED.natural_change,
                        birth_rate     = EXCLUDED.birth_rate,
                        death_rate     = EXCLUDED.death_rate,
                        data_year      = EXCLUDED.data_year,
                        fetched_at     = now()
                    """,
                    [
                        (
                            r.ags, r.district_name, r.births, r.deaths,
                            r.natural_change, r.birth_rate, r.death_rate, r.data_year,
                        )
                        for r in rows
                    ],
                )
                cur.execute("""
                    UPDATE natural_population_current t
                       SET district_name = e.district_name
                      FROM employment_current e
                     WHERE t.ags = e.ags AND (t.district_name = '' OR t.district_name IS NULL)
                """)
                cur.execute("SELECT count(*) FROM natural_population_current")
                count = cur.fetchone()[0]

    logger.info("natural_population_current now has %d rows", count)


def write_gdp_batch(rows: list[GdpRaw]) -> None:
    if not rows:
        logger.warning("write_gdp_batch called with empty rows list")
        return

    logger.info("Upserting %d GDP rows into gdp_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO gdp_current
                        (ags, district_name, gdp_total_millions, gdp_per_capita, data_year, fetched_at)
                    VALUES (%s, %s, %s, %s, %s, now())
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name      = EXCLUDED.district_name,
                        gdp_total_millions = EXCLUDED.gdp_total_millions,
                        gdp_per_capita     = EXCLUDED.gdp_per_capita,
                        data_year          = EXCLUDED.data_year,
                        fetched_at         = now()
                    """,
                    [
                        (
                            r.ags, r.district_name, r.gdp_total_millions,
                            r.gdp_per_capita, r.data_year,
                        )
                        for r in rows
                    ],
                )
                cur.execute("""
                    UPDATE gdp_current t SET district_name = e.district_name
                      FROM employment_current e
                     WHERE t.ags = e.ags AND (t.district_name = '' OR t.district_name IS NULL)
                """)
                cur.execute("SELECT count(*) FROM gdp_current")
                count = cur.fetchone()[0]

    logger.info("gdp_current now has %d rows", count)


def write_broadband_batch(rows: list[BroadbandRaw]) -> None:
    if not rows:
        logger.warning("write_broadband_batch called with empty rows list")
        return

    logger.info("Upserting %d broadband rows into broadband_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO broadband_current
                        (ags, district_name, cov_100mbit, cov_1gbit,
                         cov_fiber, cov_mobile_5g, data_year, fetched_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, now())
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name = EXCLUDED.district_name,
                        cov_100mbit   = EXCLUDED.cov_100mbit,
                        cov_1gbit     = EXCLUDED.cov_1gbit,
                        cov_fiber     = EXCLUDED.cov_fiber,
                        cov_mobile_5g = EXCLUDED.cov_mobile_5g,
                        data_year     = EXCLUDED.data_year,
                        fetched_at    = now()
                    """,
                    [
                        (
                            r.ags, r.district_name, r.cov_100mbit, r.cov_1gbit,
                            r.cov_fiber, r.cov_mobile_5g, r.data_year,
                        )
                        for r in rows
                    ],
                )
                cur.execute("""
                    UPDATE broadband_current t SET district_name = e.district_name
                      FROM employment_current e
                     WHERE t.ags = e.ags AND (t.district_name = '' OR t.district_name IS NULL)
                """)
                cur.execute("SELECT count(*) FROM broadband_current")
                count = cur.fetchone()[0]

    logger.info("broadband_current now has %d rows", count)


def write_commuters_batch(rows: list[CommutersRaw]) -> None:
    if not rows:
        logger.warning("write_commuters_batch called with empty rows list")
        return

    logger.info("Upserting %d commuter rows into commuters_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO commuters_current
                        (ags, district_name, commuters_in, commuters_out,
                         commuter_balance, commuter_ratio, data_year, fetched_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, now())
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name    = EXCLUDED.district_name,
                        commuters_in     = EXCLUDED.commuters_in,
                        commuters_out    = EXCLUDED.commuters_out,
                        commuter_balance = EXCLUDED.commuter_balance,
                        commuter_ratio   = EXCLUDED.commuter_ratio,
                        data_year        = EXCLUDED.data_year,
                        fetched_at       = now()
                    """,
                    [
                        (
                            r.ags, r.district_name, r.commuters_in, r.commuters_out,
                            r.commuter_balance, r.commuter_ratio, r.data_year,
                        )
                        for r in rows
                    ],
                )
                cur.execute("""
                    UPDATE commuters_current t SET district_name = e.district_name
                      FROM employment_current e
                     WHERE t.ags = e.ags AND (t.district_name = '' OR t.district_name IS NULL)
                """)
                cur.execute("SELECT count(*) FROM commuters_current")
                count = cur.fetchone()[0]

    logger.info("commuters_current now has %d rows", count)


def write_housing_batch(rows: list[HousingRaw]) -> None:
    if not rows:
        logger.warning("write_housing_batch called with empty rows list")
        return

    logger.info("Upserting %d housing rows into housing_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO housing_current
                        (ags, district_name, rent_per_sqm, vacancy_rate, data_year, fetched_at)
                    VALUES (%s, %s, %s, %s, %s, now())
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name = EXCLUDED.district_name,
                        rent_per_sqm  = EXCLUDED.rent_per_sqm,
                        vacancy_rate  = EXCLUDED.vacancy_rate,
                        data_year     = EXCLUDED.data_year,
                        fetched_at    = now()
                    """,
                    [
                        (r.ags, r.district_name, r.rent_per_sqm, r.vacancy_rate, r.data_year)
                        for r in rows
                    ],
                )
                cur.execute("""
                    UPDATE housing_current t SET district_name = e.district_name
                      FROM employment_current e
                     WHERE t.ags = e.ags AND (t.district_name = '' OR t.district_name IS NULL)
                """)
                cur.execute("SELECT count(*) FROM housing_current")
                count = cur.fetchone()[0]

    logger.info("housing_current now has %d rows", count)


def write_healthcare_batch(rows: list[HealthcareRaw]) -> None:
    if not rows:
        logger.warning("write_healthcare_batch called with empty rows list")
        return

    logger.info("Upserting %d healthcare rows into healthcare_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO healthcare_current
                        (ags, district_name, doctors_per_100k,
                         hospital_beds_per_100k, data_year, fetched_at)
                    VALUES (%s, %s, %s, %s, %s, now())
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name          = EXCLUDED.district_name,
                        doctors_per_100k       = EXCLUDED.doctors_per_100k,
                        hospital_beds_per_100k = EXCLUDED.hospital_beds_per_100k,
                        data_year              = EXCLUDED.data_year,
                        fetched_at             = now()
                    """,
                    [
                        (
                            r.ags, r.district_name, r.doctors_per_100k,
                            r.hospital_beds_per_100k, r.data_year,
                        )
                        for r in rows
                    ],
                )
                cur.execute("""
                    UPDATE healthcare_current t SET district_name = e.district_name
                      FROM employment_current e
                     WHERE t.ags = e.ags AND (t.district_name = '' OR t.district_name IS NULL)
                """)
                cur.execute("SELECT count(*) FROM healthcare_current")
                count = cur.fetchone()[0]

    logger.info("healthcare_current now has %d rows", count)


def write_transit_batch(rows: list[TransitRaw]) -> None:
    if not rows:
        logger.warning("write_transit_batch called with empty rows list")
        return

    logger.info("Upserting %d transit rows into transit_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO transit_current
                        (ags, district_name, station_count,
                         has_long_distance, best_category, data_date, fetched_at)
                    VALUES (%s, %s, %s, %s, %s, %s, now())
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name     = CASE
                            WHEN EXCLUDED.district_name != '' THEN EXCLUDED.district_name
                            ELSE transit_current.district_name
                        END,
                        station_count     = EXCLUDED.station_count,
                        has_long_distance = EXCLUDED.has_long_distance,
                        best_category     = EXCLUDED.best_category,
                        data_date         = EXCLUDED.data_date,
                        fetched_at        = now()
                    """,
                    [
                        (
                            r.ags, r.district_name, r.station_count,
                            r.has_long_distance, r.best_category, r.data_date,
                        )
                        for r in rows
                    ],
                )
                # Backfill district_name from employment_current where blank
                cur.execute("""
                    UPDATE transit_current t
                       SET district_name = e.district_name
                      FROM employment_current e
                     WHERE t.ags = e.ags
                       AND (t.district_name = '' OR t.district_name IS NULL)
                """)
                logger.info(
                    "Transit: backfilled district_name for %d rows", cur.rowcount
                )
                cur.execute("SELECT count(*) FROM transit_current")
                count = cur.fetchone()[0]

    logger.info("transit_current now has %d rows", count)


# ---------------------------------------------------------------------------
# INKAR 2025 — Phase 2+ social / structural indicators
# ---------------------------------------------------------------------------


def write_social_batch(rows: list[SocialRaw]) -> None:
    if not rows:
        logger.warning("write_social_batch called with empty rows list")
        return

    logger.info("Upserting %d social rows into social_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO social_current
                        (ags, district_name, income_monthly_eur, child_poverty_pct,
                         old_age_poverty_pct, crime_rate_per_100k, data_year, fetched_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, now())
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name       = EXCLUDED.district_name,
                        income_monthly_eur  = EXCLUDED.income_monthly_eur,
                        child_poverty_pct   = EXCLUDED.child_poverty_pct,
                        old_age_poverty_pct = EXCLUDED.old_age_poverty_pct,
                        crime_rate_per_100k = EXCLUDED.crime_rate_per_100k,
                        data_year           = EXCLUDED.data_year,
                        fetched_at          = now()
                    """,
                    [
                        (
                            r.ags, r.district_name, r.income_monthly_eur,
                            r.child_poverty_pct, r.old_age_poverty_pct,
                            r.crime_rate_per_100k, r.data_year,
                        )
                        for r in rows
                    ],
                )
                cur.execute("""
                    UPDATE social_current t SET district_name = e.district_name
                      FROM employment_current e
                     WHERE t.ags = e.ags AND (t.district_name = '' OR t.district_name IS NULL)
                """)
                cur.execute("SELECT count(*) FROM social_current")
                count = cur.fetchone()[0]

    logger.info("social_current now has %d rows", count)


def write_education_batch(rows: list[EducationRaw]) -> None:
    if not rows:
        logger.warning("write_education_batch called with empty rows list")
        return

    logger.info("Upserting %d education rows into education_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO education_current
                        (ags, district_name, abitur_rate, dropout_rate, data_year, fetched_at)
                    VALUES (%s, %s, %s, %s, %s, now())
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name = EXCLUDED.district_name,
                        abitur_rate   = EXCLUDED.abitur_rate,
                        dropout_rate  = EXCLUDED.dropout_rate,
                        data_year     = EXCLUDED.data_year,
                        fetched_at    = now()
                    """,
                    [
                        (r.ags, r.district_name, r.abitur_rate, r.dropout_rate, r.data_year)
                        for r in rows
                    ],
                )
                cur.execute("""
                    UPDATE education_current t SET district_name = e.district_name
                      FROM employment_current e
                     WHERE t.ags = e.ags AND (t.district_name = '' OR t.district_name IS NULL)
                """)
                cur.execute("SELECT count(*) FROM education_current")
                count = cur.fetchone()[0]

    logger.info("education_current now has %d rows", count)


def write_accessibility_batch(rows: list[AccessibilityRaw]) -> None:
    if not rows:
        logger.warning("write_accessibility_batch called with empty rows list")
        return

    logger.info("Upserting %d accessibility rows into accessibility_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO accessibility_current
                        (ags, district_name, dist_supermarket_m, dist_pharmacy_m,
                         dist_transit_stop_m, data_year, fetched_at)
                    VALUES (%s, %s, %s, %s, %s, %s, now())
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name       = EXCLUDED.district_name,
                        dist_supermarket_m  = EXCLUDED.dist_supermarket_m,
                        dist_pharmacy_m     = EXCLUDED.dist_pharmacy_m,
                        dist_transit_stop_m = EXCLUDED.dist_transit_stop_m,
                        data_year           = EXCLUDED.data_year,
                        fetched_at          = now()
                    """,
                    [
                        (
                            r.ags, r.district_name, r.dist_supermarket_m,
                            r.dist_pharmacy_m, r.dist_transit_stop_m, r.data_year,
                        )
                        for r in rows
                    ],
                )
                cur.execute("""
                    UPDATE accessibility_current t SET district_name = e.district_name
                      FROM employment_current e
                     WHERE t.ags = e.ags AND (t.district_name = '' OR t.district_name IS NULL)
                """)
                cur.execute("SELECT count(*) FROM accessibility_current")
                count = cur.fetchone()[0]

    logger.info("accessibility_current now has %d rows", count)


def write_ev_batch(rows: list[EvRaw]) -> None:
    if not rows:
        logger.warning("write_ev_batch called with empty rows list")
        return

    logger.info("Upserting %d EV rows into ev_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO ev_current
                        (ags, district_name, ev_share_pct, chargers_per_10k, data_year, fetched_at)
                    VALUES (%s, %s, %s, %s, %s, now())
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name    = EXCLUDED.district_name,
                        ev_share_pct     = EXCLUDED.ev_share_pct,
                        chargers_per_10k = EXCLUDED.chargers_per_10k,
                        data_year        = EXCLUDED.data_year,
                        fetched_at       = now()
                    """,
                    [
                        (r.ags, r.district_name, r.ev_share_pct, r.chargers_per_10k, r.data_year)
                        for r in rows
                    ],
                )
                cur.execute("""
                    UPDATE ev_current t SET district_name = e.district_name
                      FROM employment_current e
                     WHERE t.ags = e.ags AND (t.district_name = '' OR t.district_name IS NULL)
                """)
                cur.execute("SELECT count(*) FROM ev_current")
                count = cur.fetchone()[0]

    logger.info("ev_current now has %d rows", count)


def write_population_dynamics_batch(rows: list[PopulationDynamicsRaw]) -> None:
    if not rows:
        logger.warning("write_population_dynamics_batch called with empty rows list")
        return

    logger.info("Upserting %d population_dynamics rows into population_dynamics_current", len(rows))
    with psycopg.connect(_get_dsn()) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO population_dynamics_current
                        (ags, district_name, avg_age, share_65plus, net_migration_per_1000,
                         youth_migration_per_1000, pop_projection_2030_pct, data_year, fetched_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, now())
                    ON CONFLICT (ags) DO UPDATE SET
                        district_name             = EXCLUDED.district_name,
                        avg_age                   = EXCLUDED.avg_age,
                        share_65plus              = EXCLUDED.share_65plus,
                        net_migration_per_1000    = EXCLUDED.net_migration_per_1000,
                        youth_migration_per_1000  = EXCLUDED.youth_migration_per_1000,
                        pop_projection_2030_pct   = EXCLUDED.pop_projection_2030_pct,
                        data_year                 = EXCLUDED.data_year,
                        fetched_at                = now()
                    """,
                    [
                        (
                            r.ags, r.district_name, r.avg_age, r.share_65plus,
                            r.net_migration_per_1000, r.youth_migration_per_1000,
                            r.pop_projection_2030_pct, r.data_year,
                        )
                        for r in rows
                    ],
                )
                cur.execute("""
                    UPDATE population_dynamics_current t SET district_name = e.district_name
                      FROM employment_current e
                     WHERE t.ags = e.ags AND (t.district_name = '' OR t.district_name IS NULL)
                """)
                cur.execute("SELECT count(*) FROM population_dynamics_current")
                count = cur.fetchone()[0]

    logger.info("population_dynamics_current now has %d rows", count)
