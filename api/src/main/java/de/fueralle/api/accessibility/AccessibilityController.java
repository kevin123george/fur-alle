package de.fueralle.api.accessibility;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/accessibility")
public class AccessibilityController {

    private final AccessibilityService service;

    public AccessibilityController(AccessibilityService service) {
        this.service = service;
    }

    @GetMapping
    public List<AccessibilityDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public AccessibilityDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
