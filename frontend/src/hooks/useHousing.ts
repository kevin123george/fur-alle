import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { HousingDTO } from '../types/housing';

export function useHousing(ags: string | undefined) {
  const [data, setData] = useState<HousingDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.housing.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
