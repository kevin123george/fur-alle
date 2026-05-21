package de.fueralle.api.requests;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class KreisRequestService {

    private final KreisRequestRepository repository;

    public KreisRequestService(KreisRequestRepository repository) {
        this.repository = repository;
    }

    public List<KreisRequestDTO> getTopRequests() {
        return repository.findTop10().stream()
                .map(r -> new KreisRequestDTO(r.ags(), r.districtName(), r.state(), r.requestCount()))
                .toList();
    }

    @Transactional
    public KreisRequestDTO submitRequest(String ags, String districtName, String state) {
        repository.upsert(ags, districtName, state);
        return repository.findByAgs(ags)
                .map(r -> new KreisRequestDTO(r.ags(), r.districtName(), r.state(), r.requestCount()))
                .orElseThrow();
    }
}
