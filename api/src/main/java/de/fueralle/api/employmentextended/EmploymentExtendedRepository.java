package de.fueralle.api.employmentextended;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface EmploymentExtendedRepository extends Repository<EmploymentExtendedRow, Long> {

    @Query("SELECT id, ags, district_name, alq_long_term, alq_youth, alq_older, sgb2_rate, data_date " +
           "FROM employment_extended_current ORDER BY ags")
    List<EmploymentExtendedRow> findAll();

    @Query("SELECT id, ags, district_name, alq_long_term, alq_youth, alq_older, sgb2_rate, data_date " +
           "FROM employment_extended_current WHERE ags = :ags")
    Optional<EmploymentExtendedRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM employment_extended_current")
    long count();
}
