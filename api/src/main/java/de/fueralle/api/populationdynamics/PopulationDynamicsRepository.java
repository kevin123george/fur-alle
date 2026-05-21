package de.fueralle.api.populationdynamics;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface PopulationDynamicsRepository extends Repository<PopulationDynamicsRow, Long> {

    @Query("SELECT id, ags, district_name, avg_age, share_65plus, net_migration_per_1000, " +
           "youth_migration_per_1000, pop_projection_2030_pct, data_year " +
           "FROM population_dynamics_current ORDER BY ags")
    List<PopulationDynamicsRow> findAll();

    @Query("SELECT id, ags, district_name, avg_age, share_65plus, net_migration_per_1000, " +
           "youth_migration_per_1000, pop_projection_2030_pct, data_year " +
           "FROM population_dynamics_current WHERE ags = :ags")
    Optional<PopulationDynamicsRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM population_dynamics_current")
    long count();
}
