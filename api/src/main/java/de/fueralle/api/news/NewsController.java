package de.fueralle.api.news;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/news")
public class NewsController {

    private final NewsService service;

    public NewsController(NewsService service) {
        this.service = service;
    }

    @GetMapping("/{ags}")
    public List<NewsItemDTO> byAgs(
            @PathVariable String ags,
            @RequestParam(defaultValue = "") String name) {
        return service.getNews(ags, name);
    }
}
