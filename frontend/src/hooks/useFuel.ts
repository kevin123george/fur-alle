import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { FuelDTO } from '../types/fuel';

export function useFuel(ags: string | undefined) {
  const [data, setData] = useState<FuelDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) { setLoading(false); return; }
    setLoading(true);
    api.fuel.byAgs(ags)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
