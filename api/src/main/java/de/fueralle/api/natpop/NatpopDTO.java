package de.fueralle.api.natpop;

import java.math.BigDecimal;

public record NatpopDTO(
        String ags,
        String districtName,
        Integer births,
        Integer deaths,
        Integer naturalChange,
        BigDecimal birthRate,
        BigDecimal deathRate,
        Integer dataYear
) {}
