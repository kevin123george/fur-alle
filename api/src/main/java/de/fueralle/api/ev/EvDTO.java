package de.fueralle.api.ev;

import java.math.BigDecimal;

public record EvDTO(
        String ags,
        String districtName,
        BigDecimal evSharePct,
        BigDecimal chargersPer10k,
        Integer dataYear
) {}
