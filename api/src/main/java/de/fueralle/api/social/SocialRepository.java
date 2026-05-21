package de.fueralle.api.social;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface SocialRepository extends Repository<SocialRow, Long> {

    @Query("SELECT id, ags, district_name, income_monthly_eur, child_poverty_pct, " +
           "old_age_poverty_pct, crime_rate_per_100k, data_year " +
           "FROM social_current ORDER BY ags")
    List<SocialRow> findAll();

    @Query("SELECT id, ags, district_name, income_monthly_eur, child_poverty_pct, " +
           "old_age_poverty_pct, crime_rate_per_100k, data_year " +
           "FROM social_current WHERE ags = :ags")
    Optional<SocialRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM social_current")
    long count();
}
