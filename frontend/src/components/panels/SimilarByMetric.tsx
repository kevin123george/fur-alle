import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { kreisPath } from '../../lib/kreis-slugs';

interface SimilarKreis {
  ags: string;
  value: number;
  diff: number;
}

interface Props {
  metric: string;
  currentAgs: string;
  currentValue: number | null | undefined;
  label: string;
  unit: string;
  format?: (v: number) => string;
}

function defaultFormat(v: number, unit: string): string {
  if (unit === '€' || unit === '€/Mon') return `${Math.round(v).toLocaleString('de-DE')} ${unit}`;
  if (unit === '%') return `${v.toFixed(1)} %`;
  if (unit === '€/m²') return `${v.toFixed(2)} €/m²`;
  return `${v.toFixed(1)}${unit ? ' ' + unit : ''}`;
}

function useBreakpoint() {
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { isMobile: width < 640 };
}

export function SimilarByMetric({ metric, currentAgs, currentValue, label, unit, format }: Props) {
  const [overlay, setOverlay] = useState<{ ags: string; value: number }[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    if (currentValue == null) return;
    api.map.overlay(metric).then(setOverlay).catch(() => {});
  }, [metric, currentValue]);

  useEffect(() => {
    if (!overlay.length) return;
    api.employment.all().then(rows => {
      const m: Record<string, string> = {};
      rows.forEach(r => { m[r.ags] = r.districtName; });
      setNames(m);
    }).catch(() => {});
  }, [overlay]);

  const similar = useMemo<SimilarKreis[]>(() => {
    if (currentValue == null || !overlay.length) return [];
    return overlay
      .filter(o => o.ags !== currentAgs)
      .map(o => ({ ags: o.ags, value: o.value, diff: Math.abs(o.value - currentValue) }))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 5);
  }, [overlay, currentAgs, currentValue]);

  if (!similar.length) return null;

  const fmt = format ?? ((v: number) => defaultFormat(v, unit));
  const maxVal = Math.max(...similar.map(s => s.value), currentValue ?? 0);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
        Ähnlichste Kreise nach {label}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)', gap: 10 }}>
        {similar.map(s => (
          <Link key={s.ags} to={kreisPath(s.ags)} style={{ textDecoration: 'none' }}>
            <div
              className="card bg-base-100 shadow-xs border border-base-200"
              style={{ padding: '14px 14px', transition: 'all 0.15s ease', cursor: 'pointer' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '';
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.3, marginBottom: 6 }}>
                {names[s.ags] ?? s.ags}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(s.value)}
                </span>
                {s.diff >= 0.1 && (
                  <span style={{ fontSize: 10, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                    Δ {defaultFormat(s.diff, unit)}
                  </span>
                )}
              </div>
              <div style={{ height: 3, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: maxVal > 0 ? `${Math.min((s.value / maxVal) * 100, 100)}%` : '0%',
                  background: '#2563eb',
                  borderRadius: 2,
                }} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
