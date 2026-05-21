package de.fueralle.api.fuel;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Table("fuel_prices_current")
public record FuelRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("e5_avg") BigDecimal e5Avg,
        @Column("e10_avg") BigDecimal e10Avg,
        @Column("diesel_avg") BigDecimal dieselAvg,
        @Column("station_count") Integer stationCount,
        @Column("fetched_at") OffsetDateTime fetchedAt
) {}
