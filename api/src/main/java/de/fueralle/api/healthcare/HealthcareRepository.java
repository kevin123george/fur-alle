package de.fueralle.api.healthcare;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface HealthcareRepository extends Repository<HealthcareRow, Long> {

    @Query("SELECT id, ags, district_name, doctors_per_100k, hospital_beds_per_100k, data_year " +
           "FROM healthcare_current ORDER BY ags")
    List<HealthcareRow> findAll();

    @Query("SELECT id, ags, district_name, doctors_per_100k, hospital_beds_per_100k, data_year " +
           "FROM healthcare_current WHERE ags = :ags")
    Optional<HealthcareRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM healthcare_current")
    long count();
}
