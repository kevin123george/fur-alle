package de.fueralle.api.healthcare;

import java.math.BigDecimal;

public record HealthcareDTO(
        String ags,
        String districtName,
        BigDecimal doctorsPer100k,
        BigDecimal hospitalBedsPer100k,
        Integer dataYear
) {}
