package de.fueralle.api.social;

import java.math.BigDecimal;

public record SocialDTO(
        String ags,
        String districtName,
        BigDecimal incomeMonthlyEur,
        BigDecimal childPovertyPct,
        BigDecimal oldAgePovertyPct,
        BigDecimal crimeRatePer100k,
        Integer dataYear
) {}
