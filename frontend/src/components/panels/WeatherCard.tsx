import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { WeatherDTO } from '../../types/weather';
import { SkeletonText } from '../common/SkeletonCard';
import { SourceBanner } from '../common/SourceBanner';
import { AnimatedNumber } from '../common/AnimatedNumber';

const CONDITION_LABELS: Record<string, string> = {
  dry: 'Trocken', fog: 'Nebel', rain: 'Regen',
  sleet: 'Graupel', snow: 'Schnee', hail: 'Hagel', thunderstorm: 'Gewitter',
};

const CONDITION_ICONS: Record<string, string> = {
  dry: '☀️', fog: '🌫️', rain: '🌧️',
  sleet: '🌨️', snow: '❄️', hail: '🌩️', thunderstorm: '⛈️',
};

function WeatherStat({ label, value, unit }: { label: string; value: React.ReactNode | null; unit?: string }) {
  return (
    <div className="text-center">
      <div className="text-[11px] font-semibold text-base-content/40 uppercase tracking-wide mb-1">{label}</div>
      {value == null ? (
        <SkeletonText width="40px" />
      ) : (
        <div className="text-xl font-extrabold text-base-content tabular-nums">
          {value}
          {unit && <span className="text-xs font-medium text-base-content/40 ml-0.5">{unit}</span>}
        </div>
      )}
    </div>
  );
}

export function WeatherCard({ ags }: { ags: string }) {
  const [data, setData] = useState<WeatherDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setUnavailable(false);
    api.weather.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setUnavailable(true); setLoading(false); });
  }, [ags]);

  if (unavailable) return null;

  const datenstandFormatted = data?.dataDate
    ? new Date(data.dataDate).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
    : '…';

  const conditionKey = data?.condition ?? '';
  const conditionLabel = CONDITION_LABELS[conditionKey] ?? conditionKey;
  const conditionIcon = CONDITION_ICONS[conditionKey] ?? '🌤️';

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-base-content m-0">🌤️ Aktuelles Wetter</h2>
        <span className="badge badge-success badge-sm font-bold">JETZT</span>
      </div>

      <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
        {/* Condition header */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-base-200 bg-base-200/40">
          <span className="text-4xl">{loading ? '⏳' : conditionIcon}</span>
          <div>
            <div className="text-xs text-base-content/40 mb-0.5">Wetterlage</div>
            {loading ? (
              <SkeletonText width="100px" />
            ) : (
              <div className="text-lg font-bold text-base-content">{conditionLabel || '—'}</div>
            )}
          </div>
          {!loading && data?.temperature != null && (
            <div className="ml-auto text-right">
              <div className="text-5xl font-extrabold text-primary tabular-nums leading-none">
                <AnimatedNumber value={Number(data.temperature)} format={n => n.toFixed(1)} />
                <span className="text-xl font-medium text-base-content/40">°C</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-base-200">
          {[
            { label: 'Wind',         raw: data?.windSpeed    != null ? Number(data.windSpeed)    : null, unit: 'km/h', fmt: (n: number) => n.toFixed(1) },
            { label: 'Niederschlag', raw: data?.precipitation != null ? Number(data.precipitation) : null, unit: 'mm',   fmt: (n: number) => n.toFixed(1) },
            { label: 'Luftfeuchte', raw: data?.humidity      != null ? Number(data.humidity)      : null, unit: '%',    fmt: (n: number) => String(Math.round(n)) },
          ].map(s => (
            <div key={s.label} className="py-4 px-3">
              <WeatherStat label={s.label} value={loading || s.raw == null ? null : <AnimatedNumber value={s.raw} format={s.fmt} />} unit={s.unit} />
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-base-200">
          <SourceBanner
            source="Deutscher Wetterdienst via Brightsky"
            datenstand={datenstandFormatted}
            frequency="stündlich"
          />
        </div>
      </div>
    </section>
  );
}
