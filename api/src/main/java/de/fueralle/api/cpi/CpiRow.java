package de.fueralle.api.cpi;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;

@Table("cpi_current")
public record CpiRow(
        @Id Long id,
        @Column("category") String category,
        @Column("year_month") LocalDate yearMonth,
        @Column("yoy_pct") Double yoyPct
) {}
