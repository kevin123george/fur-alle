package de.fueralle.api.employment;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface EmploymentRepository extends Repository<EmploymentRow, Long> {

    @Query("SELECT id, ags, district_name, unemployment_rate, unemployed, data_date " +
           "FROM employment_current ORDER BY ags")
    List<EmploymentRow> findAll();

    @Query("SELECT id, ags, district_name, unemployment_rate, unemployed, data_date " +
           "FROM employment_current WHERE ags = :ags")
    Optional<EmploymentRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM employment_current")
    long count();
}
