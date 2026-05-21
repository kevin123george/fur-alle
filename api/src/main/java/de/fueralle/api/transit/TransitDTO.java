package de.fueralle.api.transit;

import java.time.LocalDate;

public record TransitDTO(
        String ags,
        String districtName,
        Integer stationCount,
        Boolean hasLongDistance,
        Integer bestCategory,
        LocalDate dataDate
) {}
