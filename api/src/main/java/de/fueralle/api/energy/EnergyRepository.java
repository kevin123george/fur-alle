package de.fueralle.api.energy;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;

public interface EnergyRepository extends Repository<EnergyRow, Long> {

    @Query("SELECT id, filter_code, ts_utc, mwh_quarter, mw_instant, data_date " +
           "FROM energy_current " +
           "WHERE ts_utc > now() - INTERVAL '24 hours' " +
           "ORDER BY filter_code, ts_utc")
    List<EnergyRow> findLast24Hours();

    @Query("SELECT DISTINCT ON (filter_code) id, filter_code, ts_utc, mwh_quarter, mw_instant, data_date " +
           "FROM energy_current " +
           "WHERE mwh_quarter IS NOT NULL " +
           "ORDER BY filter_code, ts_utc DESC")
    List<EnergyRow> findLatestPerFilter();

    @Query("SELECT count(*) FROM energy_current")
    long count();
}
