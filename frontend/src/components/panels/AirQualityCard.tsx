import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { AirQualityDTO } from '../../types/airquality';
import { SkeletonText } from '../common/SkeletonCard';
import { SourceBanner } from '../common/SourceBanner';
import { AnimatedNumber } from '../common/AnimatedNumber';

const THRESHOLDS = {
  pm10: { good: 20, moderate: 40, bad: 50 },
  no2:  { good: 25, moderate: 40, bad: 200 },
  o3:   { good: 60, moderate: 120, bad: 180 },
  pm25: { good: 10, moderate: 20, bad: 25 },
};

function qualityColor(v: number, t: { good: number; moderate: number; bad: number }) {
  if (v <= t.good)     return 'text-success';
  if (v <= t.moderate) return 'text-warning';
  if (v <= t.bad)      return 'text-error';
  return 'text-error';
}

function qualityBg(v: number, t: { good: number; moderate: number; bad: number }) {
  if (v <= t.good)     return 'bg-success';
  if (v <= t.moderate) return 'bg-warning';
  return 'bg-error';
}

function qualityLabel(v: number, t: { good: number; moderate: number; bad: number }) {
  if (v <= t.good)     return 'Gut';
  if (v <= t.moderate) return 'Mäßig';
  if (v <= t.bad)      return 'Erhöht';
  return 'Hoch';
}

function qualityBadgeClass(v: number, t: { good: number; moderate: number; bad: number }) {
  if (v <= t.good)     return 'badge-success';
  if (v <= t.moderate) return 'badge-warning';
  return 'badge-error';
}

function PollutantBar({ label, value, unit = 'µg/m³', thresholds }: {
  label: string;
  value: number | null | undefined;
  unit?: string;
  thresholds: { good: number; moderate: number; bad: number };
}) {
  if (value == null) return null;
  const pct = Math.min((value / thresholds.bad) * 100, 100);

  return (
    <div className="mb-3.5">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-semibold text-base-content/50">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-base font-extrabold tabular-nums ${qualityColor(value, thresholds)}`}>
            <AnimatedNumber value={Number(value)} format={n => n.toFixed(1)} />
            <span className="text-[10px] font-medium text-base-content/30 ml-0.5">{unit}</span>
          </span>
          <span className={`badge badge-xs ${qualityBadgeClass(value, thresholds)} font-bold`}>
            {qualityLabel(value, thresholds)}
          </span>
        </div>
      </div>
      <div className="bg-base-200 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-[width] duration-500 ${qualityBg(value, thresholds)}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AirQualityCard({ ags }: { ags: string }) {
  const [data, setData] = useState<AirQualityDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setUnavailable(false);
    api.airquality.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setUnavailable(true); setLoading(false); });
  }, [ags]);

  if (unavailable) return null;

  const datenstandFormatted = data?.dataDate
    ? new Date(data.dataDate).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
    : '…';

  const hasAnyData = data && (data.pm10 != null || data.no2 != null || data.o3 != null || data.pm25 != null);

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-base-content m-0">🌬️ Luftqualität</h2>
        <span className="badge badge-success badge-sm font-bold">AKTUELL</span>
      </div>

      <div className="card bg-base-100 border border-base-200 shadow-sm p-5">
        {loading ? (
          <div className="flex flex-col gap-3.5">
            <SkeletonText width="80%" />
            <SkeletonText width="60%" />
            <SkeletonText width="70%" />
          </div>
        ) : !hasAnyData ? (
          <p className="text-sm text-base-content/40">Keine Messwerte verfügbar für diesen Standort.</p>
        ) : (
          <>
            {data?.stationName && (
              <div className="text-xs text-base-content/40 mb-4">
                Messstation: <strong className="text-base-content/60">{data.stationName}</strong>
              </div>
            )}
            <PollutantBar label="PM10" value={data?.pm10} thresholds={THRESHOLDS.pm10} />
            <PollutantBar label="NO₂"  value={data?.no2}  thresholds={THRESHOLDS.no2} />
            <PollutantBar label="O₃"   value={data?.o3}   thresholds={THRESHOLDS.o3} />
            <PollutantBar label="PM2.5" value={data?.pm25} thresholds={THRESHOLDS.pm25} />
          </>
        )}

        <div className="mt-4">
          <SourceBanner source="Umweltbundesamt (UBA)" datenstand={datenstandFormatted} frequency="stündlich" />
        </div>
      </div>
    </section>
  );
}
