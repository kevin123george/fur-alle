import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { NatPopDTO } from '../types/natpop';

export function useNatPop(ags: string | undefined) {
  const [data, setData] = useState<NatPopDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.natpop.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
