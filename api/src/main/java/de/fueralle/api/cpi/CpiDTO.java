package de.fueralle.api.cpi;

import java.time.LocalDate;

public record CpiDTO(
        String category,
        LocalDate yearMonth,
        Double yoyPct
) {}
