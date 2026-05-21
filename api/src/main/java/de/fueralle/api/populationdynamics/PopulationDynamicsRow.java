package de.fueralle.api.populationdynamics;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Table("population_dynamics_current")
public record PopulationDynamicsRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("avg_age") BigDecimal avgAge,
        @Column("share_65plus") BigDecimal share65plus,
        @Column("net_migration_per_1000") BigDecimal netMigrationPer1000,
        @Column("youth_migration_per_1000") BigDecimal youthMigrationPer1000,
        @Column("pop_projection_2030_pct") BigDecimal popProjection2030Pct,
        @Column("data_year") Integer dataYear
) {}
