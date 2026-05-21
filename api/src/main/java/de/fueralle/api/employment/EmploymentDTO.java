package de.fueralle.api.employment;

import java.math.BigDecimal;

public record EmploymentDTO(
        String ags,
        String districtName,
        BigDecimal unemploymentRate,
        Integer unemployed,
        String dataDate
) {}
