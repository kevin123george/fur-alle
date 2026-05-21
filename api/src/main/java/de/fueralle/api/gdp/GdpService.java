package de.fueralle.api.gdp;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GdpService {

    private final GdpRepository repository;

    public GdpService(GdpRepository repository) {
        this.repository = repository;
    }

    public List<GdpDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("gdp_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public GdpDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("gdp_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No GDP data found for AGS: " + ags));
    }

    private GdpDTO toDTO(GdpRow row) {
        return new GdpDTO(
                row.ags(),
                row.districtName(),
                row.gdpTotalMillions(),
                row.gdpPerCapita(),
                row.dataYear()
        );
    }
}
