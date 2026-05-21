package de.fueralle.api.renewables;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Table("renewables_current")
public record RenewablesRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("solar_count") Integer solarCount,
        @Column("solar_kwp") BigDecimal solarKwp,
        @Column("wind_count") Integer windCount,
        @Column("wind_kw") BigDecimal windKw,
        @Column("biomass_count") Integer biomassCount,
        @Column("biomass_kw") BigDecimal biomassKw,
        @Column("ev_chargers") Integer evChargers,
        @Column("data_date") LocalDate dataDate
) {}
