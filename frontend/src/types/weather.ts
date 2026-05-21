export interface WeatherDTO {
  ags: string;
  districtName: string;
  temperature: number | null;
  windSpeed: number | null;
  precipitation: number | null;
  condition: string | null;
  cloudCover: number | null;
  humidity: number | null;
  dataDate: string;
}
