import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { NewsItemDTO } from '../types/news';

export function useNews(ags: string | undefined, name: string | undefined) {
  const [data, setData] = useState<NewsItemDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData([]);
    api.news.byAgs(ags, name ?? '')
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags, name]);

  return { data, loading };
}
