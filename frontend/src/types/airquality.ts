export interface AirQualityDTO {
  ags: string;
  districtName: string;
  stationId: number;
  stationName: string | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  pm25: number | null;
  dataDate: string;
}
