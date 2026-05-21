package de.fueralle.api.transit;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/transit")
public class TransitController {

    private final TransitService service;

    public TransitController(TransitService service) {
        this.service = service;
    }

    @GetMapping
    public List<TransitDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public TransitDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
