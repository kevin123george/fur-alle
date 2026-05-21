package de.fueralle.api.gdp;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/gdp")
public class GdpController {

    private final GdpService service;

    public GdpController(GdpService service) {
        this.service = service;
    }

    @GetMapping
    public List<GdpDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public GdpDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
