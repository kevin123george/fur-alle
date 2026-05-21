package de.fueralle.api.commuters;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/commuters")
public class CommutersController {

    private final CommutersService service;

    public CommutersController(CommutersService service) {
        this.service = service;
    }

    @GetMapping
    public List<CommutersDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public CommutersDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
