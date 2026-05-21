import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { EnergyDTO } from '../types/energy';

const REFRESH_MS = 15 * 60 * 1000; // 15 minutes

interface State {
  data: EnergyDTO[] | null;
  loading: boolean;
  error: string | null;
}

export function useEnergy() {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });

  const fetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.energy.latest();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState(s => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Unbekannter Fehler',
      }));
    }
  }, []);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetch]);

  return { ...state, refresh: fetch };
}

export function useEnergySnapshot() {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });

  const fetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.energy.current();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState(s => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Unbekannter Fehler',
      }));
    }
  }, []);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetch]);

  return { ...state, refresh: fetch };
}
