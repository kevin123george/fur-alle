import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { GdpDTO } from '../types/gdp';

export function useGdp(ags: string | undefined) {
  const [data, setData] = useState<GdpDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.gdp.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
