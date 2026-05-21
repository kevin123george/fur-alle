package de.fueralle.api.accessibility;

public record AccessibilityDTO(
        String ags,
        String districtName,
        Integer distSupermarketM,
        Integer distPharmacyM,
        Integer distTransitStopM,
        Integer dataYear
) {}
