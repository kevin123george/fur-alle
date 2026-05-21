package de.fueralle.api.commuters;

import java.math.BigDecimal;

public record CommutersDTO(
        String ags,
        String districtName,
        Integer commutersIn,
        Integer commutersOut,
        Integer commuterBalance,
        BigDecimal commuterRatio,
        Integer dataYear
) {}
