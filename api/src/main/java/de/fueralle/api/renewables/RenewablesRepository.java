package de.fueralle.api.renewables;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface RenewablesRepository extends Repository<RenewablesRow, Long> {

    @Query("SELECT id, ags, district_name, solar_count, solar_kwp, wind_count, wind_kw, " +
           "biomass_count, biomass_kw, ev_chargers, data_date " +
           "FROM renewables_current WHERE ags = :ags")
    Optional<RenewablesRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM renewables_current")
    long count();
}
