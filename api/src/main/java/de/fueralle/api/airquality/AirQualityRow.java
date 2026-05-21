package de.fueralle.api.airquality;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Table("air_quality_current")
public record AirQualityRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("station_id") Integer stationId,
        @Column("station_name") String stationName,
        @Column("pm10") BigDecimal pm10,
        @Column("no2") BigDecimal no2,
        @Column("o3") BigDecimal o3,
        @Column("pm25") BigDecimal pm25,
        @Column("data_date") Instant dataDate
) {}
