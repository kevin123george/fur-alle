package de.fueralle.api.education;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface EducationRepository extends Repository<EducationRow, Long> {

    @Query("SELECT id, ags, district_name, abitur_rate, dropout_rate, data_year " +
           "FROM education_current ORDER BY ags")
    List<EducationRow> findAll();

    @Query("SELECT id, ags, district_name, abitur_rate, dropout_rate, data_year " +
           "FROM education_current WHERE ags = :ags")
    Optional<EducationRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM education_current")
    long count();
}
