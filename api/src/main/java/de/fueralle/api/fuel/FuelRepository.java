package de.fueralle.api.fuel;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface FuelRepository extends Repository<FuelRow, Long> {

    @Query("SELECT id, ags, district_name, e5_avg, e10_avg, diesel_avg, station_count, fetched_at " +
           "FROM fuel_prices_current WHERE ags = :ags")
    Optional<FuelRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM fuel_prices_current")
    long count();
}
