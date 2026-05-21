import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { AccessibilityDTO } from '../types/accessibility';

export function useAccessibility(ags: string | undefined) {
  const [data, setData] = useState<AccessibilityDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.accessibility.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
