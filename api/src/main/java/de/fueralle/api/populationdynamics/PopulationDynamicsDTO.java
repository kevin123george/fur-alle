package de.fueralle.api.populationdynamics;

import java.math.BigDecimal;

public record PopulationDynamicsDTO(
        String ags,
        String districtName,
        BigDecimal avgAge,
        BigDecimal share65plus,
        BigDecimal netMigrationPer1000,
        BigDecimal youthMigrationPer1000,
        BigDecimal popProjection2030Pct,
        Integer dataYear
) {}
