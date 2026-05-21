package de.fueralle.api.stats;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/etl/status")
public class EtlStatusController {

    record SourceStatus(
        String name,
        String table,
        String cadence,
        long rows,
        OffsetDateTime lastUpdated
    ) {}

    private static final List<Object[]> SOURCES = List.of(
        new Object[]{ "Energy (SMARD)",          "energy_current",               "every 15 min"    },
        new Object[]{ "Employment (BA)",          "employment_current",           "monthly"         },
        new Object[]{ "Vacancies (BA)",           "vacancies_current",            "monthly"         },
        new Object[]{ "Weather (DWD)",            "weather_current",              "hourly"          },
        new Object[]{ "Air Quality (UBA)",        "air_quality_current",          "every 3 hours"   },
        new Object[]{ "Demographics (Zensus)",    "demographics_current",         "daily"           },
        new Object[]{ "Renewables (MaStR)",       "renewables_current",           "weekly"          },
        new Object[]{ "Election results",         "election_current",             "per election"    },
        new Object[]{ "Vehicles (KBA)",           "vehicles_current",             "quarterly"       },
        new Object[]{ "Employment extended",      "employment_extended_current",  "monthly"         },
        new Object[]{ "Natural population",       "natural_population_current",   "daily"           },
        new Object[]{ "GDP",                      "gdp_current",                  "daily"           },
        new Object[]{ "Broadband",                "broadband_current",            "daily"           },
        new Object[]{ "Commuters",                "commuters_current",            "daily"           },
        new Object[]{ "Housing",                  "housing_current",              "daily"           },
        new Object[]{ "Healthcare",               "healthcare_current",           "daily"           },
        new Object[]{ "Transit (DB)",             "transit_current",              "daily"           },
        new Object[]{ "Social (INKAR)",           "social_current",               "daily"           },
        new Object[]{ "Education (INKAR)",        "education_current",            "daily"           },
        new Object[]{ "Accessibility (INKAR)",    "accessibility_current",        "daily"           },
        new Object[]{ "E-Mobility (INKAR)",       "ev_current",                   "daily"           },
        new Object[]{ "Population dynamics",      "population_dynamics_current",  "daily"           }
    );

    private final JdbcClient jdbc;

    public EtlStatusController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<SourceStatus> status() {
        return SOURCES.stream().map(s -> {
            String name    = (String) s[0];
            String table   = (String) s[1];
            String cadence = (String) s[2];

            long rows = 0;
            try {
                rows = jdbc.sql("SELECT COUNT(*) FROM " + table)
                        .query(Long.class).single();
            } catch (Exception ignored) {}

            OffsetDateTime lastUpdated = null;
            try {
                lastUpdated = jdbc
                        .sql("SELECT MAX(fetched_at) FROM " + table)
                        .query(OffsetDateTime.class).optional().orElse(null);
            } catch (Exception ignored) {}

            return new SourceStatus(name, table, cadence, rows, lastUpdated);
        }).toList();
    }
}
