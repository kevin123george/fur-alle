package de.fueralle.api.gdp;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface GdpRepository extends Repository<GdpRow, Long> {

    @Query("SELECT id, ags, district_name, gdp_total_millions, gdp_per_capita, data_year " +
           "FROM gdp_current ORDER BY ags")
    List<GdpRow> findAll();

    @Query("SELECT id, ags, district_name, gdp_total_millions, gdp_per_capita, data_year " +
           "FROM gdp_current WHERE ags = :ags")
    Optional<GdpRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM gdp_current")
    long count();
}
