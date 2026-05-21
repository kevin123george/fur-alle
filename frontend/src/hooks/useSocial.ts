import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { SocialDTO } from '../types/social';

export function useSocial(ags: string | undefined) {
  const [data, setData] = useState<SocialDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.social.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
