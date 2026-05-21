import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { EvDTO } from '../types/ev';

export function useEv(ags: string | undefined) {
  const [data, setData] = useState<EvDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.ev.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
