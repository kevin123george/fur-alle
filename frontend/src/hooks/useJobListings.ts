import { useEffect, useState } from 'react';

export interface JobListing {
  refnr: string;
  titel: string;
  beruf: string;
  arbeitgeber: string;
  ort: string;
  plz?: string;
  publishedDate: string;
  externeUrl?: string;
  arbeitszeit?: string;
}

const BASE = '/jobsuche/pc/v4/jobs';
const HEADERS = { 'X-API-Key': 'jobboerse-jobsuche' };

function cleanName(raw: string): string {
  return raw.split(',')[0].trim();
}

export interface JobFilters {
  radius: '10' | '25' | '50' | '100';
  angebotsart: '1' | '2' | '4';
  keyword: string;
  arbeitszeit: '' | 'vz' | 'tz' | 'ho' | 'mj';
  veroeffentlichtseit: '' | '1' | '7' | '30';
  sort: '1' | '4'; // 1=Relevanz, 4=Datum
}

export const DEFAULT_FILTERS: JobFilters = {
  radius: '25',
  angebotsart: '1',
  keyword: '',
  arbeitszeit: '',
  veroeffentlichtseit: '',
  sort: '1',
};

export function useJobListings(
  districtName: string | undefined,
  page: number,
  filters: JobFilters = DEFAULT_FILTERS,
) {
  const [jobs, setJobs]   = useState<JobListing[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const params = new URLSearchParams({
      umkreis:     filters.radius,
      angebotsart: filters.angebotsart,
      page:        String(page),
      size:        '20',
      sort:        filters.sort,
    });
    if (districtName) params.set('wo', cleanName(districtName));
    if (filters.keyword.trim()) params.set('was', filters.keyword.trim());
    if (filters.arbeitszeit) params.set('arbeitszeit', filters.arbeitszeit);
    if (filters.veroeffentlichtseit) params.set('veroeffentlichtseit', filters.veroeffentlichtseit);

    fetch(`${BASE}?${params}`, { headers: HEADERS })
      .then(r => r.json())
      .then((d: any) => {
        const listings: JobListing[] = (d.stellenangebote ?? []).map((j: any) => ({
          refnr:         j.refnr,
          titel:         j.titel ?? j.beruf ?? '—',
          beruf:         j.beruf ?? '',
          arbeitgeber:   j.arbeitgeber ?? '—',
          ort:           j.arbeitsort?.ort ?? '',
          plz:           j.arbeitsort?.plz?.toString(),
          publishedDate: j.aktuelleVeroeffentlichungsdatum ?? '',
          externeUrl:    j.externeUrl ?? undefined,
          arbeitszeit:   j.arbeitszeitModelle?.[0] ?? '',
        }));
        setJobs(prev => page === 1 ? listings : [...prev, ...listings]);
        setTotal(parseInt(d.maxErgebnisse ?? '0', 10));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [districtName, page, filters.radius, filters.angebotsart, filters.keyword, filters.arbeitszeit, filters.veroeffentlichtseit, filters.sort]);

  return { jobs, total, loading, error };
}
