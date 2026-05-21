package de.fueralle.api.markets;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class MarketsService {

    private static final Logger log = LoggerFactory.getLogger(MarketsService.class);

    // symbol → display name
    private static final List<String[]> SYMBOLS = List.of(
            new String[]{ "^GDAXI",   "DAX"     },
            new String[]{ "^MDAXI",   "MDAX"    },
            new String[]{ "EURUSD=X", "EUR/USD"  },
            new String[]{ "BZ=F",     "Brent"   },
            new String[]{ "TTF=F",    "TTF Gas" },
            new String[]{ "GC=F",     "Gold"    }
    );

    private static final String BASE_URL =
            "https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1d&range=1d";

    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    private volatile List<MarketQuote> cache = List.of();
    private volatile Instant cacheTime = Instant.MIN;

    public List<MarketQuote> getQuotes() {
        if (Instant.now().isBefore(cacheTime.plus(CACHE_TTL))) {
            return cache;
        }
        var fresh = new ArrayList<MarketQuote>();
        for (var sym : SYMBOLS) {
            try {
                var quote = fetchOne(sym[0], sym[1]);
                if (quote != null) fresh.add(quote);
            } catch (Exception e) {
                log.warn("Markets: failed to fetch {}: {}", sym[0], e.getMessage());
            }
        }
        if (!fresh.isEmpty()) {
            cache = List.copyOf(fresh);
            cacheTime = Instant.now();
            log.debug("Markets: refreshed {} quotes", cache.size());
        }
        return cache;
    }

    private MarketQuote fetchOne(String symbol, String name) throws Exception {
        String encoded = symbol.replace("^", "%5E").replace("=", "%3D");
        var req = HttpRequest.newBuilder(URI.create(String.format(BASE_URL, encoded)))
                .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(10))
                .GET().build();

        var resp = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) {
            log.warn("Yahoo Finance v8 returned {} for {}", resp.statusCode(), symbol);
            return null;
        }

        var root = mapper.readValue(resp.body(), ChartResponse.class);
        var results = root.chart().result();
        if (results == null || results.isEmpty()) return null;

        var meta = results.get(0).meta();
        double price = meta.regularMarketPrice();
        double prevClose = meta.chartPreviousClose();
        double change = price - prevClose;
        double changePct = prevClose != 0 ? (change / prevClose) * 100 : 0;

        return new MarketQuote(
                symbol, name, price, change, changePct,
                meta.currency() != null ? meta.currency() : "",
                "REGULAR"
        );
    }

    // ── Jackson DTOs ──────────────────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ChartResponse(ChartWrapper chart) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ChartWrapper(List<ChartResult> result) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ChartResult(ChartMeta meta) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ChartMeta(
            double regularMarketPrice,
            double chartPreviousClose,
            String currency,
            String shortName
    ) {}
}
