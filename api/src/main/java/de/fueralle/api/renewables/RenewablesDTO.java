package de.fueralle.api.renewables;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RenewablesDTO(
        String ags,
        String districtName,
        Integer solarCount,
        BigDecimal solarKwp,
        Integer windCount,
        BigDecimal windKw,
        Integer biomassCount,
        BigDecimal biomassKw,
        Integer evChargers,
        LocalDate dataDate
) {}
