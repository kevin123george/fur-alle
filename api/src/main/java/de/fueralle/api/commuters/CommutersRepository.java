package de.fueralle.api.commuters;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface CommutersRepository extends Repository<CommutersRow, Long> {

    @Query("SELECT id, ags, district_name, commuters_in, commuters_out, commuter_balance, commuter_ratio, data_year " +
           "FROM commuters_current ORDER BY ags")
    List<CommutersRow> findAll();

    @Query("SELECT id, ags, district_name, commuters_in, commuters_out, commuter_balance, commuter_ratio, data_year " +
           "FROM commuters_current WHERE ags = :ags")
    Optional<CommutersRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM commuters_current")
    long count();
}
