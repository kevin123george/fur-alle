package de.fueralle.api.ev;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EvService {

    private final EvRepository repository;

    public EvService(EvRepository repository) {
        this.repository = repository;
    }

    public List<EvDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("ev_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public EvDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("ev_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No EV data found for AGS: " + ags));
    }

    private EvDTO toDTO(EvRow row) {
        return new EvDTO(
                row.ags(),
                row.districtName(),
                row.evSharePct(),
                row.chargersPer10k(),
                row.dataYear()
        );
    }
}
