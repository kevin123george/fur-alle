package de.fueralle.api.employmentextended;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmploymentExtendedService {

    private final EmploymentExtendedRepository repository;

    public EmploymentExtendedService(EmploymentExtendedRepository repository) {
        this.repository = repository;
    }

    public List<EmploymentExtendedDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("employment_extended_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public EmploymentExtendedDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("employment_extended_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No employment extended data found for AGS: " + ags));
    }

    private EmploymentExtendedDTO toDTO(EmploymentExtendedRow row) {
        return new EmploymentExtendedDTO(
                row.ags(),
                row.districtName(),
                row.alqLongTerm(),
                row.alqYouth(),
                row.alqOlder(),
                row.sgb2Rate(),
                row.dataDate()
        );
    }
}
