import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { VacanciesDTO } from '../types/vacancies';

export function useVacancies(ags: string | undefined) {
  const [data, setData] = useState<VacanciesDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.vacancies.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
