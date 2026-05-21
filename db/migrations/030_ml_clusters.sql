CREATE TABLE IF NOT EXISTS kreis_clusters_current (
    id             BIGSERIAL PRIMARY KEY,
    ags            TEXT          NOT NULL UNIQUE,
    district_name  TEXT          NOT NULL,
    cluster_id     INT           NOT NULL,
    cluster_label  TEXT          NOT NULL,
    cluster_color  TEXT          NOT NULL,
    similar_kreise JSONB,
    feature_vector JSONB,
    fetched_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kreis_clusters_cluster_id_idx ON kreis_clusters_current (cluster_id);
