package de.fueralle.api.weather;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

@Service
public class WeatherService {

    private final WeatherRepository repository;

    public WeatherService(WeatherRepository repository) {
        this.repository = repository;
    }

    public WeatherDTO getByAgs(String ags) {
        return repository.findByAgs(ags)
                .map(this::toDTO)
                .orElseThrow(() -> new DataNotReadyException("No weather data for AGS: " + ags));
    }

    private WeatherDTO toDTO(WeatherRow r) {
        return new WeatherDTO(
                r.ags(), r.districtName(), r.temperature(), r.windSpeed(),
                r.precipitation(), r.condition(), r.cloudCover(), r.humidity(), r.dataDate()
        );
    }
}
