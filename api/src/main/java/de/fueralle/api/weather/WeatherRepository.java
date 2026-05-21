package de.fueralle.api.weather;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface WeatherRepository extends Repository<WeatherRow, Long> {

    @Query("SELECT id, ags, district_name, temperature, wind_speed, precipitation, " +
           "condition, cloud_cover, humidity, data_date " +
           "FROM weather_current WHERE ags = :ags")
    Optional<WeatherRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM weather_current")
    long count();
}
