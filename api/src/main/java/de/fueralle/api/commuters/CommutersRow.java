package de.fueralle.api.commuters;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Table("commuters_current")
public record CommutersRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("commuters_in") Integer commutersIn,
        @Column("commuters_out") Integer commutersOut,
        @Column("commuter_balance") Integer commuterBalance,
        @Column("commuter_ratio") BigDecimal commuterRatio,
        @Column("data_year") Integer dataYear
) {}
