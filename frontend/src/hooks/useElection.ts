import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { ElectionDTO } from '../types/election';

export function useElection(ags: string | undefined) {
  const [data, setData] = useState<ElectionDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.election.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
