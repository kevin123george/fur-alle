package de.fueralle.api.employmentextended;

import java.math.BigDecimal;

public record EmploymentExtendedDTO(
        String ags,
        String districtName,
        BigDecimal alqLongTerm,
        BigDecimal alqYouth,
        BigDecimal alqOlder,
        BigDecimal sgb2Rate,
        String dataDate
) {}

