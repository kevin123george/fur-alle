package de.fueralle.api.clusters;

import com.fasterxml.jackson.annotation.JsonRawValue;

import java.time.OffsetDateTime;

public record ClusterDTO(
        String ags,
        String districtName,
        Integer clusterId,
        String clusterLabel,
        String clusterColor,
        @JsonRawValue String similarKreise,
        OffsetDateTime fetchedAt
) {}
