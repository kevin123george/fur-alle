package de.fueralle.api.clusters;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClusterRepository extends CrudRepository<ClusterRow, Long> {

    @Query("""
            SELECT id, ags, district_name, cluster_id, cluster_label, cluster_color,
                   similar_kreise::text AS similar_kreise,
                   feature_vector::text AS feature_vector,
                   fetched_at
            FROM kreis_clusters_current
            WHERE ags = :ags
            """)
    Optional<ClusterRow> findByAgs(@Param("ags") String ags);

    @Query("""
            SELECT id, ags, district_name, cluster_id, cluster_label, cluster_color,
                   similar_kreise::text AS similar_kreise,
                   feature_vector::text AS feature_vector,
                   fetched_at
            FROM kreis_clusters_current
            ORDER BY ags
            """)
    List<ClusterRow> findAllOrdered();
}
