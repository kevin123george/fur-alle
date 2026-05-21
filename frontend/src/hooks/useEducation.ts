import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { EducationDTO } from '../types/education';

export function useEducation(ags: string | undefined) {
  const [data, setData] = useState<EducationDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);
    api.education.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ags]);

  return { data, loading };
}
