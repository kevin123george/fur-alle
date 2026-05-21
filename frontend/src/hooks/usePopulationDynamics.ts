import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { PopulationDynamicsDTO } from '../types/populationdynamics';

export function usePopulationDynamics(ags: string | undefined) {
  const [data, setData] = useState<PopulationDynamicsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.populationDynamics.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
