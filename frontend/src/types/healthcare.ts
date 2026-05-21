export interface HealthcareDTO {
  ags: string;
  districtName: string;
  doctorsPer100k: number | null;
  hospitalBedsPer100k: number | null;
  dataYear: number | null;
}
