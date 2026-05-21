import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { TransitDTO } from '../types/transit';

export function useTransit(ags: string | undefined) {
  const [data, setData] = useState<TransitDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.transit.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
