package de.fueralle.api.fuel;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record FuelDTO(
        String ags,
        String districtName,
        BigDecimal e5Avg,
        BigDecimal e10Avg,
        BigDecimal dieselAvg,
        Integer stationCount,
        OffsetDateTime fetchedAt
) {}
