package de.fueralle.api.vacancies;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/vacancies")
public class VacanciesController {

    private final VacanciesService service;

    public VacanciesController(VacanciesService service) {
        this.service = service;
    }

    @GetMapping
    public List<VacanciesDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public VacanciesDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
