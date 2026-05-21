export interface PopulationDynamicsDTO {
  ags: string;
  districtName: string;
  avgAge: number | null;
  share65plus: number | null;
  netMigrationPer1000: number | null;
  youthMigrationPer1000: number | null;
  popProjection2030Pct: number | null;
  dataYear: number | null;
}
