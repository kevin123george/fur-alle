export interface SimilarKreis {
  ags: string;
  district_name: string;
  cluster_id: number;
  cluster_label: string;
  cluster_color: string;
  similarity: number;
}

export interface ClusterDTO {
  ags: string;
  districtName: string;
  clusterId: number;
  clusterLabel: string;
  clusterColor: string;
  similarKreise: SimilarKreis[];
  fetchedAt: string;
}
