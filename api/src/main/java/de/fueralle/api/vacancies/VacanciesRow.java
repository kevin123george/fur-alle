package de.fueralle.api.vacancies;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("vacancies_current")
public record VacanciesRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("open_positions") Integer openPositions,
        @Column("reported_positions") Integer reportedPositions,
        @Column("avg_vacancy_days") Integer avgVacancyDays,
        @Column("data_date") String dataDate
) {}
