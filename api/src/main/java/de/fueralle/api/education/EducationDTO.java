package de.fueralle.api.education;

import java.math.BigDecimal;

public record EducationDTO(
        String ags,
        String districtName,
        BigDecimal abiturRate,
        BigDecimal dropoutRate,
        Integer dataYear
) {}
