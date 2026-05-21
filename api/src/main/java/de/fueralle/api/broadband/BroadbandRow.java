package de.fueralle.api.broadband;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Table("broadband_current")
public record BroadbandRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("cov_100mbit") BigDecimal cov100Mbit,
        @Column("cov_1gbit") BigDecimal cov1Gbit,
        @Column("cov_fiber") BigDecimal covFiber,
        @Column("cov_mobile_5g") BigDecimal covMobile5g,
        @Column("data_year") Integer dataYear
) {}
