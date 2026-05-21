package de.fueralle.api.employment;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/employment")
public class EmploymentController {

    private final EmploymentService service;

    public EmploymentController(EmploymentService service) {
        this.service = service;
    }

    @GetMapping
    public List<EmploymentDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public EmploymentDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
