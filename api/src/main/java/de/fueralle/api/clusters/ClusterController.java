package de.fueralle.api.clusters;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/clusters")
public class ClusterController {

    private final ClusterRepository repository;

    public ClusterController(ClusterRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<ClusterDTO> all() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("kreis_clusters_current is empty — ML job has not run yet");
        }
        return repository.findAllOrdered().stream()
                .map(r -> new ClusterDTO(
                        r.ags(), r.districtName(), r.clusterId(),
                        r.clusterLabel(), r.clusterColor(),
                        r.similarKreise(), r.fetchedAt()))
                .toList();
    }

    @GetMapping("/{ags}")
    public ClusterDTO byAgs(@PathVariable String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("kreis_clusters_current is empty — ML job has not run yet");
        }
        var row = repository.findByAgs(ags)
                .orElseThrow(() -> new DataNotReadyException("No cluster data for AGS: " + ags));
        return new ClusterDTO(
                row.ags(), row.districtName(), row.clusterId(),
                row.clusterLabel(), row.clusterColor(),
                row.similarKreise(), row.fetchedAt());
    }
}
