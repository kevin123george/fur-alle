package de.fueralle.api.gdp;

import java.math.BigDecimal;

public record GdpDTO(
        String ags,
        String districtName,
        BigDecimal gdpTotalMillions,
        Integer gdpPerCapita,
        Integer dataYear
) {}
