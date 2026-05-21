import type { EnergyDTO } from '../types/energy';
import type { EmploymentDTO } from '../types/employment';
import type { WeatherDTO } from '../types/weather';
import type { AirQualityDTO } from '../types/airquality';
import type { DemographicsDTO } from '../types/demographics';
import type { RenewablesDTO } from '../types/renewables';
import type { ElectionDTO } from '../types/election';
import type { VehiclesDTO } from '../types/vehicles';
import type { VacanciesDTO } from '../types/vacancies';
import type { EmploymentExtendedDTO } from '../types/employmentextended';
import type { NatPopDTO } from '../types/natpop';
import type { GdpDTO } from '../types/gdp';
import type { BroadbandDTO } from '../types/broadband';
import type { CommutersDTO } from '../types/commuters';
import type { HousingDTO } from '../types/housing';
import type { HealthcareDTO } from '../types/healthcare';
import type { TransitDTO } from '../types/transit';
import type { SocialDTO } from '../types/social';
import type { EducationDTO } from '../types/education';
import type { AccessibilityDTO } from '../types/accessibility';
import type { EvDTO } from '../types/ev';
import type { PopulationDynamicsDTO } from '../types/populationdynamics';
import type { CpiDTO } from '../types/cpi';
import type { MarketQuote } from '../types/markets';
import type { FuelDTO } from '../types/fuel';
import type { ClusterDTO } from '../types/cluster';
import type { NewsItemDTO } from '../types/news';

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface SiteStats {
  energyDataPoints: number;
  kreisWithData: number;
  totalRequests: number;
  dataSources: number;
}

export interface KreisRequest {
  ags: string;
  districtName: string;
  state: string;
  requestCount: number;
}

export const api = {
  energy: {
    latest: () => get<EnergyDTO[]>('/energy/latest'),
    current: () => get<EnergyDTO[]>('/energy/current'),
  },
  employment: {
    all: () => get<EmploymentDTO[]>('/employment'),
    byAgs: (ags: string) => get<EmploymentDTO>(`/employment/${ags}`),
  },
  weather: {
    byAgs: (ags: string) => get<WeatherDTO>(`/weather/${ags}`),
  },
  airquality: {
    byAgs: (ags: string) => get<AirQualityDTO>(`/airquality/${ags}`),
  },
  demographics: {
    byAgs: (ags: string) => get<DemographicsDTO>(`/demographics/${ags}`),
  },
  renewables: {
    byAgs: (ags: string) => get<RenewablesDTO>(`/renewables/${ags}`),
  },
  election: {
    byAgs: (ags: string) => get<ElectionDTO>(`/election/${ags}`),
  },
  vehicles: {
    byAgs: (ags: string) => get<VehiclesDTO>(`/vehicles/${ags}`),
  },
  vacancies: {
    all: () => get<VacanciesDTO[]>('/vacancies'),
    byAgs: (ags: string) => get<VacanciesDTO>(`/vacancies/${ags}`),
  },
  employmentExtended: {
    byAgs: (ags: string) => get<EmploymentExtendedDTO>(`/employment/extended/${ags}`),
  },
  natpop: {
    byAgs: (ags: string) => get<NatPopDTO>(`/natpop/${ags}`),
  },
  gdp: {
    byAgs: (ags: string) => get<GdpDTO>(`/gdp/${ags}`),
  },
  broadband: {
    byAgs: (ags: string) => get<BroadbandDTO>(`/broadband/${ags}`),
  },
  commuters: {
    byAgs: (ags: string) => get<CommutersDTO>(`/commuters/${ags}`),
  },
  housing: {
    byAgs: (ags: string) => get<HousingDTO>(`/housing/${ags}`),
  },
  healthcare: {
    byAgs: (ags: string) => get<HealthcareDTO>(`/healthcare/${ags}`),
  },
  transit: {
    byAgs: (ags: string) => get<TransitDTO>(`/transit/${ags}`),
  },
  social: {
    byAgs: (ags: string) => get<SocialDTO>(`/social/${ags}`),
  },
  education: {
    byAgs: (ags: string) => get<EducationDTO>(`/education/${ags}`),
  },
  accessibility: {
    byAgs: (ags: string) => get<AccessibilityDTO>(`/accessibility/${ags}`),
  },
  ev: {
    byAgs: (ags: string) => get<EvDTO>(`/ev/${ags}`),
  },
  populationDynamics: {
    byAgs: (ags: string) => get<PopulationDynamicsDTO>(`/populationdynamics/${ags}`),
  },
  cpi: {
    all: () => get<CpiDTO[]>('/cpi'),
  },
  markets: {
    all: () => get<MarketQuote[]>('/markets'),
  },
  fuel: {
    byAgs: (ags: string) => get<FuelDTO>(`/fuel/${ags}`),
  },
  clusters: {
    all: () => get<ClusterDTO[]>('/clusters'),
    byAgs: (ags: string) => get<ClusterDTO>(`/clusters/${ags}`),
  },
  map: {
    overlay: (metric: string) => get<{ ags: string; value: number }[]>(`/map/overlay?metric=${metric}`),
  },
  stats: () => get<SiteStats>('/stats'),
  etl: {
    status: () => get<import('../hooks/useEtlStatus').EtlSource[]>('/etl/status'),
  },
  requests: {
    top: () => get<KreisRequest[]>('/requests'),
    submit: (ags: string, districtName: string, state: string) =>
      post<KreisRequest>('/requests', { ags, districtName, state }),
  },
  news: {
    byAgs: (ags: string, name: string) =>
      get<NewsItemDTO[]>(`/news/${ags}?name=${encodeURIComponent(name)}`),
  },
};
