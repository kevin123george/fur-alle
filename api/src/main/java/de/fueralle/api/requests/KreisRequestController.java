package de.fueralle.api.requests;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
public class KreisRequestController {

    private final KreisRequestService service;

    public KreisRequestController(KreisRequestService service) {
        this.service = service;
    }

    @GetMapping
    public List<KreisRequestDTO> top() {
        return service.getTopRequests();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public KreisRequestDTO submit(@RequestBody Map<String, String> body) {
        String ags = body.get("ags");
        String districtName = body.get("districtName");
        String state = body.get("state");
        if (ags == null || districtName == null || state == null) {
            throw new IllegalArgumentException("ags, districtName, and state are required");
        }
        return service.submitRequest(ags, districtName, state);
    }
}
