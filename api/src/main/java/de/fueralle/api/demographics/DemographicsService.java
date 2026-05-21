package de.fueralle.api.demographics;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

@Service
public class DemographicsService {

    private final DemographicsRepository repository;

    public DemographicsService(DemographicsRepository repository) {
        this.repository = repository;
    }

    public DemographicsDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("demographics_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No demographics data found for AGS: " + ags));
    }

    private DemographicsDTO toDTO(DemographicsRow row) {
        return new DemographicsDTO(
                row.ags(),
                row.districtName(),
                row.population(),
                row.areaKm2(),
                row.populationDensity(),
                row.privateHouseholds(),
                row.dataDate()
        );
    }
}
