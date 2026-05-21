package de.fueralle.api.transit;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransitService {

    private final TransitRepository repository;

    public TransitService(TransitRepository repository) {
        this.repository = repository;
    }

    public List<TransitDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("transit_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public TransitDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("transit_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No transit data found for AGS: " + ags));
    }

    private TransitDTO toDTO(TransitRow row) {
        return new TransitDTO(
                row.ags(),
                row.districtName(),
                row.stationCount(),
                row.hasLongDistance(),
                row.bestCategory(),
                row.dataDate()
        );
    }
}
