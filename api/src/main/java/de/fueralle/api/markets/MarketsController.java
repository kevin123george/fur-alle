package de.fueralle.api.markets;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/markets")
public class MarketsController {

    private final MarketsService service;

    public MarketsController(MarketsService service) {
        this.service = service;
    }

    @GetMapping
    public List<MarketQuote> quotes() {
        return service.getQuotes();
    }
}
