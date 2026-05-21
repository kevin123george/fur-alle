package de.fueralle.api.vehicles;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
public class VehiclesController {

    private final VehiclesService service;

    public VehiclesController(VehiclesService service) {
        this.service = service;
    }

    @GetMapping("/{ags}")
    public VehiclesDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
