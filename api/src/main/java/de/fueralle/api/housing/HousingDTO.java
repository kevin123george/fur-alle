package de.fueralle.api.housing;

import java.math.BigDecimal;

public record HousingDTO(
        String ags,
        String districtName,
        BigDecimal rentPerSqm,
        BigDecimal vacancyRate,
        Integer dataYear
) {}
