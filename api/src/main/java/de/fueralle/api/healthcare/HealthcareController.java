package de.fueralle.api.healthcare;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/healthcare")
public class HealthcareController {

    private final HealthcareService service;

    public HealthcareController(HealthcareService service) {
        this.service = service;
    }

    @GetMapping
    public List<HealthcareDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public HealthcareDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
