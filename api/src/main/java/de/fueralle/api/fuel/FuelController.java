package de.fueralle.api.fuel;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fuel")
public class FuelController {

    private final FuelRepository repository;

    public FuelController(FuelRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/{ags}")
    public FuelDTO byAgs(@PathVariable String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("fuel_prices_current table is empty — ETL has not run yet");
        }
        var row = repository.findByAgs(ags)
                .orElseThrow(() -> new DataNotReadyException("No fuel data for AGS: " + ags));
        return new FuelDTO(
                row.ags(), row.districtName(),
                row.e5Avg(), row.e10Avg(), row.dieselAvg(),
                row.stationCount(), row.fetchedAt()
        );
    }
}
