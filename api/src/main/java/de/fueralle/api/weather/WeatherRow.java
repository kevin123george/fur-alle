package de.fueralle.api.weather;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Table("weather_current")
public record WeatherRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("temperature") BigDecimal temperature,
        @Column("wind_speed") BigDecimal windSpeed,
        @Column("precipitation") BigDecimal precipitation,
        @Column("condition") String condition,
        @Column("cloud_cover") Integer cloudCover,
        @Column("humidity") Integer humidity,
        @Column("data_date") Instant dataDate
) {}
