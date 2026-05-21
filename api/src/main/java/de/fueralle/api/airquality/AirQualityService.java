package de.fueralle.api.airquality;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

@Service
public class AirQualityService {

    private final AirQualityRepository repository;

    public AirQualityService(AirQualityRepository repository) {
        this.repository = repository;
    }

    public AirQualityDTO getByAgs(String ags) {
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No air quality data for AGS: " + ags));
    }

    private AirQualityDTO toDTO(AirQualityRow r) {
        return new AirQualityDTO(
                r.ags(), r.districtName(), r.stationId(), r.stationName(),
                r.pm10(), r.no2(), r.o3(), r.pm25(), r.dataDate()
        );
    }
}
