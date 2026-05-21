package de.fueralle.api.ev;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ev")
public class EvController {

    private final EvService service;

    public EvController(EvService service) {
        this.service = service;
    }

    @GetMapping
    public List<EvDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public EvDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
