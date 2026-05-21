package de.fueralle.api.healthcare;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Table("healthcare_current")
public record HealthcareRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("doctors_per_100k") BigDecimal doctorsPer100k,
        @Column("hospital_beds_per_100k") BigDecimal hospitalBedsPer100k,
        @Column("data_year") Integer dataYear
) {}
