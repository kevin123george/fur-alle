import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { VehiclesDTO } from '../types/vehicles';

export function useVehicles(ags: string | undefined) {
  const [data, setData] = useState<VehiclesDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.vehicles.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
