package de.fueralle.api.employment;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Table("employment_current")
public record EmploymentRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("unemployment_rate") BigDecimal unemploymentRate,
        @Column("unemployed") Integer unemployed,
        @Column("data_date") String dataDate
) {}
