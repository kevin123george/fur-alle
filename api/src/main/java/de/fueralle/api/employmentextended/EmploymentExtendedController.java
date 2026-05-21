package de.fueralle.api.employmentextended;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/employment/extended")
public class EmploymentExtendedController {

    private final EmploymentExtendedService service;

    public EmploymentExtendedController(EmploymentExtendedService service) {
        this.service = service;
    }

    @GetMapping
    public List<EmploymentExtendedDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public EmploymentExtendedDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
