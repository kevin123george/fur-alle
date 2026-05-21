import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { CpiDTO } from '../types/cpi';

export function useCpi() {
  const [data, setData] = useState<CpiDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.cpi.all()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
