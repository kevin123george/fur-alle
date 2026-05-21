import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { CommutersDTO } from '../types/commuters';

export function useCommuters(ags: string | undefined) {
  const [data, setData] = useState<CommutersDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.commuters.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
