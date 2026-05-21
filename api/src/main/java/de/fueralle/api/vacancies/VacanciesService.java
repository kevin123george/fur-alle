package de.fueralle.api.vacancies;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VacanciesService {

    private final VacanciesRepository repository;

    public VacanciesService(VacanciesRepository repository) {
        this.repository = repository;
    }

    public List<VacanciesDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("vacancies_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public VacanciesDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("vacancies_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No vacancies data found for AGS: " + ags));
    }

    private VacanciesDTO toDTO(VacanciesRow row) {
        return new VacanciesDTO(
                row.ags(),
                row.districtName(),
                row.openPositions(),
                row.reportedPositions(),
                row.avgVacancyDays(),
                row.dataDate()
        );
    }
}
