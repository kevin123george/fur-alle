package de.fueralle.api.stats;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final JdbcClient jdbc;

    public StatsController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public Map<String, Object> stats() {
        long energyRows    = jdbc.sql("SELECT count(*) FROM energy_current").query(Long.class).single();
        long kreisWithData = jdbc.sql("SELECT count(*) FROM employment_current").query(Long.class).single();
        long totalRequests = jdbc.sql("SELECT coalesce(sum(request_count),0) FROM kreis_requests").query(Long.class).single();

        String[] tables = {
            "energy_current", "employment_current", "weather_current", "air_quality_current",
            "demographics_current", "renewables_current", "election_current", "vehicles_current",
            "vacancies_current", "employment_extended_current", "natural_population_current",
            "gdp_current", "broadband_current", "commuters_current", "housing_current",
            "healthcare_current", "transit_current", "social_current", "education_current",
            "accessibility_current", "ev_current", "population_dynamics_current"
        };
        long dataSources = 0;
        for (String table : tables) {
            long n = jdbc.sql("SELECT count(*) FROM " + table).query(Long.class).single();
            if (n > 0) dataSources++;
        }

        return Map.of(
            "energyDataPoints", energyRows,
            "kreisWithData", kreisWithData,
            "totalRequests", totalRequests,
            "dataSources", dataSources
        );
    }
}
