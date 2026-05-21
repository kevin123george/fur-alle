package de.fueralle.api.gdp;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Table("gdp_current")
public record GdpRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("gdp_total_millions") BigDecimal gdpTotalMillions,
        @Column("gdp_per_capita") Integer gdpPerCapita,
        @Column("data_year") Integer dataYear
) {}
