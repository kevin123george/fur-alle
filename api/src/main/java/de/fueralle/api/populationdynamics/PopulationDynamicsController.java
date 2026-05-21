package de.fueralle.api.populationdynamics;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/populationdynamics")
public class PopulationDynamicsController {

    private final PopulationDynamicsService service;

    public PopulationDynamicsController(PopulationDynamicsService service) {
        this.service = service;
    }

    @GetMapping
    public List<PopulationDynamicsDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public PopulationDynamicsDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
