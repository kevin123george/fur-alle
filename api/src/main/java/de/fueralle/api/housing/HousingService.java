package de.fueralle.api.housing;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HousingService {

    private final HousingRepository repository;

    public HousingService(HousingRepository repository) {
        this.repository = repository;
    }

    public List<HousingDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("housing_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public HousingDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("housing_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No housing data found for AGS: " + ags));
    }

    private HousingDTO toDTO(HousingRow row) {
        return new HousingDTO(
                row.ags(),
                row.districtName(),
                row.rentPerSqm(),
                row.vacancyRate(),
                row.dataYear()
        );
    }
}
