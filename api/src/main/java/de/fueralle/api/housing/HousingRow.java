package de.fueralle.api.housing;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Table("housing_current")
public record HousingRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("rent_per_sqm") BigDecimal rentPerSqm,
        @Column("vacancy_rate") BigDecimal vacancyRate,
        @Column("data_year") Integer dataYear
) {}
