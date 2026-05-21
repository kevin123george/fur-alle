import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ClusterDTO } from '../types/cluster';

export function useCluster(ags: string | undefined) {
  const [data, setData] = useState<ClusterDTO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    api.clusters.byAgs(ags)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
