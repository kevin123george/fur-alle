package de.fueralle.api.vehicles;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface VehiclesRepository extends Repository<VehiclesRow, Long> {

    @Query("SELECT id, ags, district_name, cars_total, cars_per_1000, electric, electric_share, " +
           "hybrid, hybrid_share, data_date " +
           "FROM vehicles_current WHERE ags = :ags")
    Optional<VehiclesRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM vehicles_current")
    long count();
}
