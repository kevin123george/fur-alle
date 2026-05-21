package de.fueralle.api.broadband;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface BroadbandRepository extends Repository<BroadbandRow, Long> {

    @Query("SELECT id, ags, district_name, cov_100mbit, cov_1gbit, cov_fiber, cov_mobile_5g, data_year " +
           "FROM broadband_current ORDER BY ags")
    List<BroadbandRow> findAll();

    @Query("SELECT id, ags, district_name, cov_100mbit, cov_1gbit, cov_fiber, cov_mobile_5g, data_year " +
           "FROM broadband_current WHERE ags = :ags")
    Optional<BroadbandRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM broadband_current")
    long count();
}
