package de.fueralle.api.renewables;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

@Service
public class RenewablesService {

    private final RenewablesRepository repository;

    public RenewablesService(RenewablesRepository repository) {
        this.repository = repository;
    }

    public RenewablesDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("renewables_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No renewables data found for AGS: " + ags));
    }

    private RenewablesDTO toDTO(RenewablesRow row) {
        return new RenewablesDTO(
                row.ags(),
                row.districtName(),
                row.solarCount(),
                row.solarKwp(),
                row.windCount(),
                row.windKw(),
                row.biomassCount(),
                row.biomassKw(),
                row.evChargers(),
                row.dataDate()
        );
    }
}
