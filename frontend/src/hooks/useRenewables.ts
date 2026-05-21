import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { RenewablesDTO } from '../types/renewables';

export function useRenewables(ags: string | undefined) {
  const [data, setData] = useState<RenewablesDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.renewables.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
