package de.fueralle.api.ev;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface EvRepository extends Repository<EvRow, Long> {

    @Query("SELECT id, ags, district_name, ev_share_pct, chargers_per_10k, data_year " +
           "FROM ev_current ORDER BY ags")
    List<EvRow> findAll();

    @Query("SELECT id, ags, district_name, ev_share_pct, chargers_per_10k, data_year " +
           "FROM ev_current WHERE ags = :ags")
    Optional<EvRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM ev_current")
    long count();
}
