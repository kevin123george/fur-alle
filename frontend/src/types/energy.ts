export interface EnergyPoint {
  tsUtc: string;
  mwhQuarter: number | null;
  mwInstant: number | null;
}

export interface EnergyDTO {
  filterCode: number;
  filterName: string;
  series: EnergyPoint[];
  dataDate: string;
}

export const FILTER_CODE_LABELS: Record<number, string> = {
  410:  'Netzlast',
  4068: 'Photovoltaik',
  4067: 'Wind Onshore',
  1225: 'Wind Offshore',
  4066: 'Biomasse',
};
