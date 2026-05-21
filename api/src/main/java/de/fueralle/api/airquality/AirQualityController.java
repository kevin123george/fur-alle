package de.fueralle.api.airquality;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/airquality")
public class AirQualityController {

    private final AirQualityService service;

    public AirQualityController(AirQualityService service) {
        this.service = service;
    }

    @GetMapping("/{ags}")
    public AirQualityDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
