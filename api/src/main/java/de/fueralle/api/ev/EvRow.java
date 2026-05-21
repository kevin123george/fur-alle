package de.fueralle.api.ev;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Table("ev_current")
public record EvRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("ev_share_pct") BigDecimal evSharePct,
        @Column("chargers_per_10k") BigDecimal chargersPer10k,
        @Column("data_year") Integer dataYear
) {}
