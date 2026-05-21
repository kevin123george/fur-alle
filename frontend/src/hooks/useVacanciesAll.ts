import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { VacanciesDTO } from '../types/vacancies';

export function useVacanciesAll() {
  const [data, setData] = useState<VacanciesDTO[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.vacancies.all()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { data, loading };
}
