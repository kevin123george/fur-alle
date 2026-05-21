package de.fueralle.api.broadband;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/broadband")
public class BroadbandController {

    private final BroadbandService service;

    public BroadbandController(BroadbandService service) {
        this.service = service;
    }

    @GetMapping
    public List<BroadbandDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public BroadbandDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
