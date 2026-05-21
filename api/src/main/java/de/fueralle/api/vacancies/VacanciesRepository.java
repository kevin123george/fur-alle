package de.fueralle.api.vacancies;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface VacanciesRepository extends Repository<VacanciesRow, Long> {

    @Query("SELECT id, ags, district_name, open_positions, reported_positions, avg_vacancy_days, data_date " +
           "FROM vacancies_current ORDER BY ags")
    List<VacanciesRow> findAll();

    @Query("SELECT id, ags, district_name, open_positions, reported_positions, avg_vacancy_days, data_date " +
           "FROM vacancies_current WHERE ags = :ags")
    Optional<VacanciesRow> findByAgs(String ags);

    @Query("SELECT count(*) FROM vacancies_current")
    long count();
}
