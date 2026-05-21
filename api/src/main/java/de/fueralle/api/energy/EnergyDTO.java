package de.fueralle.api.energy;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record EnergyDTO(
        int filterCode,
        String filterName,
        List<EnergyPoint> series,
        LocalDate dataDate
) {
    public record EnergyPoint(Instant tsUtc, BigDecimal mwhQuarter, BigDecimal mwInstant) {}
}
