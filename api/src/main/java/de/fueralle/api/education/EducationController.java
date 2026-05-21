package de.fueralle.api.education;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/education")
public class EducationController {

    private final EducationService service;

    public EducationController(EducationService service) {
        this.service = service;
    }

    @GetMapping
    public List<EducationDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public EducationDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
