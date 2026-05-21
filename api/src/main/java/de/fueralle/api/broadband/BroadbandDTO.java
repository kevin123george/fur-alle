package de.fueralle.api.broadband;

import java.math.BigDecimal;

public record BroadbandDTO(
        String ags,
        String districtName,
        BigDecimal cov100Mbit,
        BigDecimal cov1Gbit,
        BigDecimal covFiber,
        BigDecimal covMobile5g,
        Integer dataYear
) {}
