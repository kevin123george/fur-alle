package de.fueralle.api.accessibility;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface AccessibilityRepository extends Repository<AccessibilityRow, Long> {

    @Query("SELECT id, ags, district_name, dist_supermarket_m, dist_pharmacy_m, " +
           "dist_transit_stop_m, data_year FROM accessibility_current ORDER BY ags")
    List<AccessibilityRow> findAll();

    @Query("SELECT id, ags, district_name, dist_supermarket_m, dist_pharmacy_m, " +
           "dist_transit_stop_m, data_year FROM accessibility_current WHERE ags = :ags")
    Optional<AccessibilityRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM accessibility_current")
    long count();
}
