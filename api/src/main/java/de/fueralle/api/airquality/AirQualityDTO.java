package de.fueralle.api.airquality;

import java.math.BigDecimal;
import java.time.Instant;

public record AirQualityDTO(
        String ags,
        String districtName,
        Integer stationId,
        String stationName,
        BigDecimal pm10,
        BigDecimal no2,
        BigDecimal o3,
        BigDecimal pm25,
        Instant dataDate
) {}
