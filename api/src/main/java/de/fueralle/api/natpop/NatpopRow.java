package de.fueralle.api.natpop;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Table("natural_population_current")
public record NatpopRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("births") Integer births,
        @Column("deaths") Integer deaths,
        @Column("natural_change") Integer naturalChange,
        @Column("birth_rate") BigDecimal birthRate,
        @Column("death_rate") BigDecimal deathRate,
        @Column("data_year") Integer dataYear
) {}
