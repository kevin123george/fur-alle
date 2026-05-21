package de.fueralle.api.election;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/election")
public class ElectionController {

    private final ElectionService service;

    public ElectionController(ElectionService service) {
        this.service = service;
    }

    @GetMapping("/{ags}")
    public ElectionDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
