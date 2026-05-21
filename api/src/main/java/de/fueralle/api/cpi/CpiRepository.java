package de.fueralle.api.cpi;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;

public interface CpiRepository extends Repository<CpiRow, Long> {

    @Query("SELECT id, category, year_month, yoy_pct " +
           "FROM cpi_current ORDER BY category, year_month")
    List<CpiRow> findAll();

    @Query("SELECT count(*) FROM cpi_current")
    long count();
}
