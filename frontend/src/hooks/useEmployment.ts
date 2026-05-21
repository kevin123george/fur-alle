import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { EmploymentDTO } from '../types/employment';

interface State {
  data: EmploymentDTO[] | null;
  loading: boolean;
  error: string | null;
}

export function useEmployment() {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });

  useEffect(() => {
    api.employment.all()
      .then(data => setState({ data, loading: false, error: null }))
      .catch(err => setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unbekannter Fehler',
      }));
  }, []);

  return state;
}
