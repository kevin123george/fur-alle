import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { MarketQuote } from '../types/markets';

const REFRESH_MS = 5 * 60 * 1000;

export function useMarkets() {
  const [data, setData] = useState<MarketQuote[] | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    const load = () =>
      api.markets.all()
        .then(d => { setData(d); setLastRefresh(new Date()); })
        .catch(() => {});

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return { data, lastRefresh };
}
