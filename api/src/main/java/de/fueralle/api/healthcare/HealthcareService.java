package de.fueralle.api.healthcare;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HealthcareService {

    private final HealthcareRepository repository;

    public HealthcareService(HealthcareRepository repository) {
        this.repository = repository;
    }

    public List<HealthcareDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("healthcare_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public HealthcareDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("healthcare_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No healthcare data found for AGS: " + ags));
    }

    private HealthcareDTO toDTO(HealthcareRow row) {
        return new HealthcareDTO(
                row.ags(),
                row.districtName(),
                row.doctorsPer100k(),
                row.hospitalBedsPer100k(),
                row.dataYear()
        );
    }
}
