package de.fueralle.api.social;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SocialService {

    private final SocialRepository repository;

    public SocialService(SocialRepository repository) {
        this.repository = repository;
    }

    public List<SocialDTO> getAll() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("social_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    public SocialDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("social_current table is empty — ETL has not run yet");
        }
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No social data found for AGS: " + ags));
    }

    private SocialDTO toDTO(SocialRow row) {
        return new SocialDTO(
                row.ags(),
                row.districtName(),
                row.incomeMonthlyEur(),
                row.childPovertyPct(),
                row.oldAgePovertyPct(),
                row.crimeRatePer100k(),
                row.dataYear()
        );
    }
}
