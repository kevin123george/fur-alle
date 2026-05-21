import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export interface EtlSource {
  name: string;
  table: string;
  cadence: string;
  rows: number;
  lastUpdated: string | null;
}

export function useEtlStatus() {
  const [data, setData]       = useState<EtlSource[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.etl.status()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
