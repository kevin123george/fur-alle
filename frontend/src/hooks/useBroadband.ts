import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { BroadbandDTO } from '../types/broadband';

export function useBroadband(ags: string | undefined) {
  const [data, setData] = useState<BroadbandDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.broadband.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
