package de.fueralle.api.cpi;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cpi")
public class CpiController {

    private final CpiRepository repository;

    public CpiController(CpiRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<CpiDTO> all() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("cpi_current table is empty — ETL has not run yet");
        }
        return repository.findAll().stream()
                .map(r -> new CpiDTO(r.category(), r.yearMonth(), r.yoyPct()))
                .toList();
    }
}
