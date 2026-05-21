package de.fueralle.api.natpop;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface NatpopRepository extends Repository<NatpopRow, Long> {

    @Query("SELECT id, ags, district_name, births, deaths, natural_change, birth_rate, death_rate, data_year " +
           "FROM natural_population_current ORDER BY ags")
    List<NatpopRow> findAll();

    @Query("SELECT id, ags, district_name, births, deaths, natural_change, birth_rate, death_rate, data_year " +
           "FROM natural_population_current WHERE ags = :ags")
    Optional<NatpopRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM natural_population_current")
    long count();
}
