package de.fueralle.api.energy;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Table("energy_current")
public record EnergyRow(
        @Id Long id,
        @Column("filter_code") int filterCode,
        @Column("ts_utc") Instant tsUtc,
        @Column("mwh_quarter") BigDecimal mwhQuarter,
        @Column("mw_instant") BigDecimal mwInstant,
        @Column("data_date") LocalDate dataDate
) {}
