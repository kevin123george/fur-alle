package de.fueralle.api.vehicles;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VehiclesDTO(
        String ags,
        String districtName,
        Integer carsTotal,
        BigDecimal carsPer1000,
        Integer electric,
        BigDecimal electricShare,
        Integer hybrid,
        BigDecimal hybridShare,
        LocalDate dataDate
) {}
