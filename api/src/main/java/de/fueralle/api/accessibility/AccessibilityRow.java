package de.fueralle.api.accessibility;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("accessibility_current")
public record AccessibilityRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("dist_supermarket_m") Integer distSupermarketM,
        @Column("dist_pharmacy_m") Integer distPharmacyM,
        @Column("dist_transit_stop_m") Integer distTransitStopM,
        @Column("data_year") Integer dataYear
) {}
