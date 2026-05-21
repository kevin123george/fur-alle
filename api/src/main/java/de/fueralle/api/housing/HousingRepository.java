package de.fueralle.api.housing;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface HousingRepository extends Repository<HousingRow, Long> {

    @Query("SELECT id, ags, district_name, rent_per_sqm, vacancy_rate, data_year " +
           "FROM housing_current ORDER BY ags")
    List<HousingRow> findAll();

    @Query("SELECT id, ags, district_name, rent_per_sqm, vacancy_rate, data_year " +
           "FROM housing_current WHERE ags = :ags")
    Optional<HousingRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM housing_current")
    long count();
}
