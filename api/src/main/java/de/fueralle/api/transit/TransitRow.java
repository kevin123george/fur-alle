package de.fueralle.api.transit;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;

@Table("transit_current")
public record TransitRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("station_count") Integer stationCount,
        @Column("has_long_distance") Boolean hasLongDistance,
        @Column("best_category") Integer bestCategory,
        @Column("data_date") LocalDate dataDate
) {}
