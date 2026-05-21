package de.fueralle.api.energy;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/energy")
public class EnergyController {

    private final EnergyService service;

    public EnergyController(EnergyService service) {
        this.service = service;
    }

    @GetMapping("/latest")
    public List<EnergyDTO> latest() {
        return service.getLatest24Hours();
    }

    @GetMapping("/current")
    public List<EnergyDTO> current() {
        return service.getCurrentSnapshot();
    }
}
