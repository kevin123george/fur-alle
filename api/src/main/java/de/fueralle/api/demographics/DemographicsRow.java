package de.fueralle.api.demographics;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Table("demographics_current")
public record DemographicsRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("population") Integer population,
        @Column("area_km2") BigDecimal areaKm2,
        @Column("population_density") BigDecimal populationDensity,
        @Column("private_households") Integer privateHouseholds,
        @Column("data_date") LocalDate dataDate
) {}
