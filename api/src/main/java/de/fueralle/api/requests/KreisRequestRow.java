package de.fueralle.api.requests;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("kreis_requests")
public record KreisRequestRow(
        @Id Long id,
        @Column("ags") String ags,
        @Column("kreis_name") String districtName,
        @Column("state") String state,
        @Column("request_count") int requestCount
) {}
