package de.fueralle.api.transit;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface TransitRepository extends Repository<TransitRow, Long> {

    @Query("SELECT id, ags, district_name, station_count, has_long_distance, best_category, data_date " +
           "FROM transit_current ORDER BY ags")
    List<TransitRow> findAll();

    @Query("SELECT id, ags, district_name, station_count, has_long_distance, best_category, data_date " +
           "FROM transit_current WHERE ags = :ags")
    Optional<TransitRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM transit_current")
    long count();
}
