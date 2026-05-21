package de.fueralle.api.map;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/map")
public class MapOverlayController {

    record OverlayPoint(String ags, Double value) {}

    private static final Map<String, String> METRIC_SQL = Map.of(
        "unemployment", "SELECT ags, unemployment_rate::float  FROM employment_current    WHERE unemployment_rate  IS NOT NULL",
        "gdp",          "SELECT ags, gdp_per_capita::float     FROM gdp_current            WHERE gdp_per_capita     IS NOT NULL",
        "density",      "SELECT ags, population_density::float FROM demographics_current   WHERE population_density IS NOT NULL",
        "broadband",    "SELECT ags, cov_100mbit::float        FROM broadband_current      WHERE cov_100mbit        IS NOT NULL",
        "rent",         "SELECT ags, rent_per_sqm::float       FROM housing_current        WHERE rent_per_sqm       IS NOT NULL",
        "ev",           "SELECT ags, electric_share::float     FROM vehicles_current       WHERE electric_share     IS NOT NULL",
        "doctors",      "SELECT ags, doctors_per_100k::float   FROM healthcare_current     WHERE doctors_per_100k   IS NOT NULL",
        "income",       "SELECT ags, income_monthly_eur::float FROM social_current         WHERE income_monthly_eur IS NOT NULL"
    );

    private final JdbcClient jdbc;

    public MapOverlayController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/overlay")
    public List<OverlayPoint> overlay(@RequestParam String metric) {
        String sql = METRIC_SQL.get(metric);
        if (sql == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown metric: " + metric);
        }
        return jdbc.sql(sql)
                .query((rs, i) -> new OverlayPoint(rs.getString("ags"), rs.getDouble(2)))
                .list();
    }
}
