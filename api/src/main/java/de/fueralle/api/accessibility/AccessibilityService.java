package de.fueralle.api.accessibility;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AccessibilityService {

    private final AccessibilityRepository repository;

    public AccessibilityService(AccessibilityRepository repository) {
        this.repository = repository;
    }

    public List<AccessibilityDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("accessibility_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public AccessibilityDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("accessibility_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No accessibility data found for AGS: " + ags));
    }

    private AccessibilityDTO toDTO(AccessibilityRow row) {
        return new AccessibilityDTO(
                row.ags(),
                row.districtName(),
                row.distSupermarketM(),
                row.distPharmacyM(),
                row.distTransitStopM(),
                row.dataYear()
        );
    }
}
