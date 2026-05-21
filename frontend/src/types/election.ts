export interface ElectionDTO {
  constituencyNr: number;
  constituencyName: string;
  electionYear: number;
  turnout: number | null;
  spd: number | null;
  cduCsu: number | null;
  greens: number | null;
  fdp: number | null;
  afd: number | null;
  leftParty: number | null;
  other: number | null;
  dataDate: string | null;
  ags: string[];
}
