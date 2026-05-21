import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { HealthcareDTO } from '../types/healthcare';

export function useHealthcare(ags: string | undefined) {
  const [data, setData] = useState<HealthcareDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.healthcare.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
