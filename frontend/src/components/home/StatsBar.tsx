import { useEffect, useState } from 'react';
import { api, type SiteStats } from '../../lib/api';
import { AnimatedNumber } from '../common/AnimatedNumber';

interface StatTileProps { value: number | null; format: (n: number) => string; label: string; icon: string; }

function StatTile({ value, format, label, icon }: StatTileProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px',
      background: 'rgba(255,255,255,0.06)', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.09)',
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
      <div>
        {value !== null ? (
          <div className="count-up" style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
            <AnimatedNumber value={value} format={format} />
          </div>
        ) : (
          <div style={{
            height: 22, width: 52, borderRadius: 4,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.08) 75%)',
            backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
          }} />
        )}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4, letterSpacing: '0.02em' }}>{label}</div>
      </div>
    </div>
  );
}

export function StatsBar() {
  const [stats, setStats] = useState<SiteStats | null>(null);

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
  }, []);

  return (
    <div style={{ background: '#0f172a', padding: '12px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div className="stats-grid">
          <StatTile icon="⚡" label="Energiemesspunkte"    value={stats?.energyDataPoints ?? null} format={n => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n))} />
          <StatTile icon="🗺️" label="Landkreise mit Daten" value={stats?.kreisWithData   ?? null} format={n => String(Math.round(n))} />
          <StatTile icon="📡" label="Datenquellen"         value={stats?.dataSources      ?? null} format={n => String(Math.round(n))} />
          <StatTile icon="🗳️" label="Bürgeranfragen"       value={stats?.totalRequests    ?? null} format={n => String(Math.round(n))} />
        </div>
      </div>
    </div>
  );
}
