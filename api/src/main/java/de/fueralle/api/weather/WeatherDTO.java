package de.fueralle.api.weather;

import java.math.BigDecimal;
import java.time.Instant;

public record WeatherDTO(
        String ags,
        String districtName,
        BigDecimal temperature,
        BigDecimal windSpeed,
        BigDecimal precipitation,
        String condition,
        Integer cloudCover,
        Integer humidity,
        Instant dataDate
) {}
