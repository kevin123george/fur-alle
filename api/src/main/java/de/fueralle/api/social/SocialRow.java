package de.fueralle.api.social;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Table("social_current")
public record SocialRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("income_monthly_eur") BigDecimal incomeMonthlyEur,
        @Column("child_poverty_pct") BigDecimal childPovertyPct,
        @Column("old_age_poverty_pct") BigDecimal oldAgePovertyPct,
        @Column("crime_rate_per_100k") BigDecimal crimeRatePer100k,
        @Column("data_year") Integer dataYear
) {}
