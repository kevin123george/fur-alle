package de.fueralle.api.social;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/social")
public class SocialController {

    private final SocialService service;

    public SocialController(SocialService service) {
        this.service = service;
    }

    @GetMapping
    public List<SocialDTO> all() {
        return service.getAll();
    }

    @GetMapping("/{ags}")
    public SocialDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
