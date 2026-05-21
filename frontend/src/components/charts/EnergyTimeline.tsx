import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { EnergyDTO } from '../../types/energy';
import { ENERGY_COLORS } from '../../lib/colors';

interface Props { data: EnergyDTO[]; }

interface ChartPoint { ts: number; [key: string]: number | null; }

export function EnergyTimeline({ data }: Props) {
  const { chartData, renewableNames } = useMemo(() => {
    const pointMap = new Map<number, ChartPoint>();
    for (const series of data) {
      for (const pt of series.series) {
        const ts = new Date(pt.tsUtc).getTime();
        if (!pointMap.has(ts)) pointMap.set(ts, { ts });
        pointMap.get(ts)![series.filterName] = pt.mwInstant != null ? Number(pt.mwInstant) : null;
      }
    }
    return {
      chartData: Array.from(pointMap.values()).sort((a, b) => a.ts - b.ts),
      renewableNames: data.filter(d => d.filterCode !== 410).map(d => d.filterName),
    };
  }, [data]);

  return (
    <div style={{ height: 260, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E4" />
          <XAxis
            dataKey="ts" type="number" scale="time" domain={['auto', 'auto']}
            tickFormatter={ts => new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            tick={{ fontSize: 11, fill: '#9B9B9B' }} tickCount={6}
          />
          <YAxis
            tickFormatter={v => `${(v / 1000).toFixed(0)} GW`}
            tick={{ fontSize: 11, fill: '#9B9B9B' }} width={52}
          />
          <Tooltip
            labelFormatter={ts => new Date(ts as number).toLocaleString('de-DE', {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any, name: any) => [v != null ? `${Number(v).toFixed(0)} MW` : '—', name]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E8E4' }}
          />
          <Legend iconSize={10} iconType="circle" />
          {renewableNames.map(name => {
            const series = data.find(d => d.filterName === name)!;
            const color = ENERGY_COLORS[series.filterCode];
            return (
              <Area
                key={name} type="monotone" dataKey={name}
                stackId="1" stroke={color} fill={color} fillOpacity={0.75}
                dot={false} connectNulls={false}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
