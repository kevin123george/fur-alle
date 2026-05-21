package de.fueralle.api.clusters;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

@Table("kreis_clusters_current")
public record ClusterRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("district_name") String districtName,
        @Column("cluster_id") Integer clusterId,
        @Column("cluster_label") String clusterLabel,
        @Column("cluster_color") String clusterColor,
        @Column("similar_kreise") String similarKreise,
        @Column("feature_vector") String featureVector,
        @Column("fetched_at") OffsetDateTime fetchedAt
) {}
