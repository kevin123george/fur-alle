package de.fueralle.api.employment;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmploymentService {

    private final EmploymentRepository repository;

    public EmploymentService(EmploymentRepository repository) {
        this.repository = repository;
    }

    public List<EmploymentDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("employment_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public EmploymentDTO getByAgs(String ags) {
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No data found for AGS: " + ags));
    }

    private EmploymentDTO toDTO(EmploymentRow row) {
        return new EmploymentDTO(row.ags(), row.districtName(), row.unemploymentRate(), row.unemployed(), row.dataDate());
    }
}
