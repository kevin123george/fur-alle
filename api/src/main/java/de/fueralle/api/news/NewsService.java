package de.fueralle.api.news;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NewsService {

    private static final Logger log = LoggerFactory.getLogger(NewsService.class);
    private static final Duration CACHE_TTL = Duration.ofHours(2);
    private static final int MAX_ITEMS = 6;

    private static final String RSS_URL =
            "https://news.google.com/rss/search?q=%s&hl=de&gl=DE&ceid=DE:de";

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private record CacheEntry(List<NewsItemDTO> items, Instant fetchedAt) {}
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public List<NewsItemDTO> getNews(String ags, String name) {
        String query = name.isBlank() ? ags : name;
        var entry = cache.get(query);
        if (entry != null && Instant.now().isBefore(entry.fetchedAt().plus(CACHE_TTL))) {
            return entry.items();
        }

        List<NewsItemDTO> items = fetchRss(query);
        if (!items.isEmpty()) {
            cache.put(query, new CacheEntry(items, Instant.now()));
        } else if (entry != null) {
            return entry.items(); // serve stale on error
        }
        return items;
    }

    private List<NewsItemDTO> fetchRss(String query) {
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = String.format(RSS_URL, encoded);

        try {
            var req = HttpRequest.newBuilder(URI.create(url))
                    .header("User-Agent", "Mozilla/5.0 (compatible; FuerAlleBot/1.0)")
                    .header("Accept", "application/rss+xml, application/xml, text/xml")
                    .timeout(Duration.ofSeconds(10))
                    .GET().build();

            var resp = http.send(req, HttpResponse.BodyHandlers.ofInputStream());
            if (resp.statusCode() != 200) {
                log.warn("News RSS returned {} for query '{}'", resp.statusCode(), query);
                return List.of();
            }
            return parseRss(resp.body());
        } catch (Exception e) {
            log.warn("News RSS fetch failed for '{}': {}", query, e.getMessage());
            return List.of();
        }
    }

    private List<NewsItemDTO> parseRss(InputStream xml) throws Exception {
        var factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        var doc = factory.newDocumentBuilder().parse(xml);
        doc.getDocumentElement().normalize();

        NodeList items = doc.getElementsByTagName("item");
        var results = new ArrayList<NewsItemDTO>();

        for (int i = 0; i < Math.min(items.getLength(), MAX_ITEMS); i++) {
            var item = (Element) items.item(i);
            String title = text(item, "title");
            String link  = text(item, "link");
            String pubDate = text(item, "pubDate");
            String source = sourceText(item);

            // Google News wraps the real URL in a redirect; use as-is
            if (!title.isBlank() && !link.isBlank()) {
                results.add(new NewsItemDTO(title, link, source, pubDate));
            }
        }
        return results;
    }

    private static String text(Element parent, String tag) {
        var nl = parent.getElementsByTagName(tag);
        if (nl.getLength() == 0) return "";
        var node = nl.item(0);
        return node.getTextContent().trim();
    }

    private static String sourceText(Element item) {
        // <source url="...">Publisher Name</source>
        var nl = item.getElementsByTagName("source");
        if (nl.getLength() > 0) return nl.item(0).getTextContent().trim();
        return "";
    }
}
