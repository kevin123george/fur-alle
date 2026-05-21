package de.fueralle.api.employmentextended;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Table("employment_extended_current")
public record EmploymentExtendedRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("alq_long_term") BigDecimal alqLongTerm,
        @Column("alq_youth") BigDecimal alqYouth,
        @Column("alq_older") BigDecimal alqOlder,
        @Column("sgb2_rate") BigDecimal sgb2Rate,
        @Column("data_date") String dataDate
) {}
