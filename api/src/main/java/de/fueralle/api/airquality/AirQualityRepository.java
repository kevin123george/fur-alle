package de.fueralle.api.airquality;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface AirQualityRepository extends Repository<AirQualityRow, Long> {

    @Query("SELECT id, ags, district_name, station_id, station_name, pm10, no2, o3, pm25, data_date " +
           "FROM air_quality_current WHERE ags = :ags")
    Optional<AirQualityRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM air_quality_current")
    long count();
}
