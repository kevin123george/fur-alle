package de.fueralle.api.commuters;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommutersService {

    private final CommutersRepository repository;

    public CommutersService(CommutersRepository repository) {
        this.repository = repository;
    }

    public List<CommutersDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("commuters_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public CommutersDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("commuters_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No commuters data found for AGS: " + ags));
    }

    private CommutersDTO toDTO(CommutersRow row) {
        return new CommutersDTO(
                row.ags(),
                row.districtName(),
                row.commutersIn(),
                row.commutersOut(),
                row.commuterBalance(),
                row.commuterRatio(),
                row.dataYear()
        );
    }
}
