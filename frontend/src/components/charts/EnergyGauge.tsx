import { useMemo } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import type { EnergyDTO } from '../../types/energy';
import { ENERGY_COLORS } from '../../lib/colors';

interface Props { snapshot: EnergyDTO[]; }

export function EnergyGauge({ snapshot }: Props) {
  const { chartData, sharePercent, netzlastGW } = useMemo(() => {
    const renewables = snapshot.filter(d => d.filterCode !== 410);
    const netzlast = snapshot.find(d => d.filterCode === 410);
    const netzlastMW = netzlast?.series[0]?.mwInstant ?? 0;
    const data = renewables.map(d => ({
      name: d.filterName,
      mw: Number(d.series[0]?.mwInstant ?? 0),
      fill: ENERGY_COLORS[d.filterCode],
    }));
    const total = data.reduce((acc, d) => acc + d.mw, 0);
    return {
      chartData: data,
      sharePercent: netzlastMW > 0 ? ((total / netzlastMW) * 100).toFixed(1) : '—',
      netzlastGW: netzlastMW > 0 ? (netzlastMW / 1000).toFixed(1) : '—',
    };
  }, [snapshot]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: '100%', height: 200, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="35%" outerRadius="90%"
            data={chartData} startAngle={180} endAngle={0}
          >
            <RadialBar dataKey="mw" cornerRadius={4} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any, name: any) => [
                v != null ? `${Number(v).toFixed(0)} MW` : '—', name,
              ]}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end',
          paddingBottom: 32, pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: '#1A1A1A', lineHeight: 1 }}>
            {sharePercent}%
          </span>
          <span style={{ fontSize: 11, color: '#6B6B6B', marginTop: 2 }}>
            Erneuerbare Energien
          </span>
        </div>
      </div>
      {/* Custom legend — wraps on mobile */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        gap: '4px 12px', marginTop: 4,
      }}>
        {chartData.map(d => (
          <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B6B6B' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.fill, flexShrink: 0 }} />
            {d.name}
          </span>
        ))}
      </div>

      <p style={{ fontSize: 13, color: '#6B6B6B', margin: '6px 0 0' }}>
        Netzlast gesamt: <strong style={{ color: '#1A1A1A' }}>{netzlastGW} GW</strong>
      </p>
    </div>
  );
}
