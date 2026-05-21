export interface TransitDTO {
  ags: string;
  districtName: string;
  stationCount: number | null;
  hasLongDistance: boolean | null;
  bestCategory: number | null;
  dataDate: string | null;
}
