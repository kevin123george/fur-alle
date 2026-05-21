import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { DemographicsDTO } from '../types/demographics';

export function useDemographics(ags: string | undefined) {
  const [data, setData] = useState<DemographicsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.demographics.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
