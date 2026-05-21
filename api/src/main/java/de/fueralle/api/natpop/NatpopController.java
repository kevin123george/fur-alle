package de.fueralle.api.natpop;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/natpop")
public class NatpopController {

    private final NatpopService service;

    public NatpopController(NatpopService service) {
        this.service = service;
    }

    @GetMapping
    public List<NatpopDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public NatpopDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
