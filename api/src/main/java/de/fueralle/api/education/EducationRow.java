package de.fueralle.api.education;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Table("education_current")
public record EducationRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("abitur_rate") BigDecimal abiturRate,
        @Column("dropout_rate") BigDecimal dropoutRate,
        @Column("data_year") Integer dataYear
) {}
