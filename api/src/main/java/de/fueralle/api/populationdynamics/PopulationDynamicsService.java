package de.fueralle.api.populationdynamics;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PopulationDynamicsService {

    private final PopulationDynamicsRepository repository;

    public PopulationDynamicsService(PopulationDynamicsRepository repository) {
        this.repository = repository;
    }

    public List<PopulationDynamicsDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("population_dynamics_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public PopulationDynamicsDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("population_dynamics_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No population dynamics data found for AGS: " + ags));
    }

    private PopulationDynamicsDTO toDTO(PopulationDynamicsRow row) {
        return new PopulationDynamicsDTO(
                row.ags(),
                row.districtName(),
                row.avgAge(),
                row.share65plus(),
                row.netMigrationPer1000(),
                row.youthMigrationPer1000(),
                row.popProjection2030Pct(),
                row.dataYear()
        );
    }
}
