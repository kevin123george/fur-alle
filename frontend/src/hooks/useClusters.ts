import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ClusterDTO } from '../types/cluster';

export function useClusters() {
  const [data, setData] = useState<ClusterDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.clusters.all()
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
