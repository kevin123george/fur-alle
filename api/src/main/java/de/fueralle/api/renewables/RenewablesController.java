package de.fueralle.api.renewables;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/renewables")
public class RenewablesController {

    private final RenewablesService service;

    public RenewablesController(RenewablesService service) {
        this.service = service;
    }

    @GetMapping("/{ags}")
    public RenewablesDTO byAgs(@PathVariable String ags) {
        return service.getByAgs(ags);
    }
}
