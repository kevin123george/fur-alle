package de.fueralle.api.education;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EducationService {

    private final EducationRepository repository;

    public EducationService(EducationRepository repository) {
        this.repository = repository;
    }

    public List<EducationDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("education_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public EducationDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("education_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No education data found for AGS: " + ags));
    }

    private EducationDTO toDTO(EducationRow row) {
        return new EducationDTO(
                row.ags(),
                row.districtName(),
                row.abiturRate(),
                row.dropoutRate(),
                row.dataYear()
        );
    }
}
