package de.fueralle.api.vacancies;

public record VacanciesDTO(
        String ags,
        String districtName,
        Integer openPositions,
        Integer reportedPositions,
        Integer avgVacancyDays,
        String dataDate
) {}
