package de.fueralle.api.demographics;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DemographicsDTO(
        String ags,
        String districtName,
        Integer population,
        BigDecimal areaKm2,
        BigDecimal populationDensity,
        Integer privateHouseholds,
        LocalDate dataDate
) {}
