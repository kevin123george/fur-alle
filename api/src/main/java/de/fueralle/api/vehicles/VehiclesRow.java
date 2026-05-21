package de.fueralle.api.vehicles;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Table("vehicles_current")
public record VehiclesRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("cars_total") Integer carsTotal,
        @Column("cars_per_1000") BigDecimal carsPer1000,
        @Column("electric") Integer electric,
        @Column("electric_share") BigDecimal electricShare,
        @Column("hybrid") Integer hybrid,
        @Column("hybrid_share") BigDecimal hybridShare,
        @Column("data_date") LocalDate dataDate
) {}
