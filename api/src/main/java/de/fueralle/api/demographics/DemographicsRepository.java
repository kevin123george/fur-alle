package de.fueralle.api.demographics;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface DemographicsRepository extends Repository<DemographicsRow, Long> {

    @Query("SELECT id, ags, district_name, population, area_km2, population_density, " +
           "private_households, data_date " +
           "FROM demographics_current WHERE ags = :ags")
    Optional<DemographicsRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM demographics_current")
    long count();
}
