package de.fueralle.api.broadband;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BroadbandService {

    private final BroadbandRepository repository;

    public BroadbandService(BroadbandRepository repository) {
        this.repository = repository;
    }

    public List<BroadbandDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("broadband_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public BroadbandDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("broadband_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No broadband data found for AGS: " + ags));
    }

    private BroadbandDTO toDTO(BroadbandRow row) {
        return new BroadbandDTO(
                row.ags(),
                row.districtName(),
                row.cov100Mbit(),
                row.cov1Gbit(),
                row.covFiber(),
                row.covMobile5g(),
                row.dataYear()
        );
    }
}
