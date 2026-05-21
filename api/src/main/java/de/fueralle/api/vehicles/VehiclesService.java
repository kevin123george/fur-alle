package de.fueralle.api.vehicles;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

@Service
public class VehiclesService {

    private final VehiclesRepository repository;

    public VehiclesService(VehiclesRepository repository) {
        this.repository = repository;
    }

    public VehiclesDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("vehicles_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No vehicles data found for AGS: " + ags));
    }

    private VehiclesDTO toDTO(VehiclesRow row) {
        return new VehiclesDTO(
                row.ags(),
                row.districtName(),
                row.carsTotal(),
                row.carsPer1000(),
                row.electric(),
                row.electricShare(),
                row.hybrid(),
                row.hybridShare(),
                row.dataDate()
        );
    }
}
