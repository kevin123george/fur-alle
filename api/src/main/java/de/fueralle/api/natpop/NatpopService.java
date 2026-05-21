package de.fueralle.api.natpop;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NatpopService {

    private final NatpopRepository repository;

    public NatpopService(NatpopRepository repository) {
        this.repository = repository;
    }

    public List<NatpopDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("natural_population_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public NatpopDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("natural_population_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No natural population data found for AGS: " + ags));
    }

    private NatpopDTO toDTO(NatpopRow row) {
        return new NatpopDTO(
                row.ags(),
                row.districtName(),
                row.births(),
                row.deaths(),
                row.naturalChange(),
                row.birthRate(),
                row.deathRate(),
                row.dataYear()
        );
    }
}
