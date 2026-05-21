import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { EmploymentExtendedDTO } from '../types/employmentextended';

export function useEmploymentExtended(ags: string | undefined) {
  const [data, setData] = useState<EmploymentExtendedDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.employmentExtended.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
