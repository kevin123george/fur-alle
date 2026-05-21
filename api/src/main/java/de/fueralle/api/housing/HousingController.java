package de.fueralle.api.housing;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/housing")
public class HousingController {

    private final HousingService service;

    public HousingController(HousingService service) {
        this.service = service;
    }

    @GetMapping
    public List<HousingDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public HousingDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
