import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export interface OverlayPoint {
  ags: string;
  value: number;
}

export const OVERLAY_METRICS = [
  { key: 'gdp',       label: 'BIP pro Kopf',        unit: '€',      higherIsBetter: true  },
  { key: 'density',   label: 'Bevölkerungsdichte',   unit: 'EW/km²', higherIsBetter: true  },
  { key: 'broadband', label: 'Breitband ≥100 Mbit',  unit: '%',      higherIsBetter: true  },
  { key: 'rent',      label: 'Angebotsmiete',         unit: '€/m²',   higherIsBetter: false },
  { key: 'ev',        label: 'E-Auto-Anteil',         unit: '%',      higherIsBetter: true  },
  { key: 'doctors',   label: 'Ärzte je 100k',         unit: '',       higherIsBetter: true  },
  { key: 'income',    label: 'Einkommen',              unit: '€/Mon',  higherIsBetter: true  },
] as const;

export type OverlayMetricKey = typeof OVERLAY_METRICS[number]['key'];

export function useMapOverlay(metric: OverlayMetricKey | null) {
  const [data, setData] = useState<OverlayPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!metric) { setData([]); return; }
    setLoading(true);
    api.map.overlay(metric)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [metric]);

  return { data, loading };
}
