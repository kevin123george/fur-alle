package de.fueralle.api.demographics;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demographics")
public class DemographicsController {

    private final DemographicsService service;

    public DemographicsController(DemographicsService service) {
        this.service = service;
    }

    @GetMapping("/{ags}")
    public DemographicsDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
