import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { useCpi } from '../../hooks/useCpi';
import type { CpiDTO } from '../../types/cpi';

const CATEGORY_COLORS: Record<string, string> = {
  'Gesamt':            '#2563eb',
  'Nahrungsmittel':    '#f59e0b',
  'Wohnen & Energie':  '#10b981',
  'Strom & Gas':       '#ef4444',
  'Verkehr':           '#8b5cf6',
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

function formatMonth(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
}

function buildChartData(rows: CpiDTO[]) {
  const byMonth: Record<string, Record<string, number | null>> = {};
  for (const r of rows) {
    if (!byMonth[r.yearMonth]) byMonth[r.yearMonth] = {};
    byMonth[r.yearMonth][r.category] = r.yoyPct;
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, vals]) => ({ month, ...vals }));
}

function getLatest(rows: CpiDTO[]): Record<string, number | null> {
  const latest: Record<string, string> = {};
  for (const r of rows) {
    if (!latest[r.category] || r.yearMonth > latest[r.category]) {
      latest[r.category] = r.yearMonth;
    }
  }
  const result: Record<string, number | null> = {};
  for (const r of rows) {
    if (r.yearMonth === latest[r.category]) result[r.category] = r.yoyPct;
  }
  return result;
}

export function InflationPanel() {
  const { data, loading } = useCpi();

  if (loading) {
    return (
      <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200" style={{ padding: 20 }}>
        <div className="skeleton-wave" style={{ height: 16, width: 160, marginBottom: 12 }} />
        <div className="skeleton-wave" style={{ height: 200 }} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
          📈 Preise & Inflation
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', padding: '32px 0', textAlign: 'center' }}>
          Noch keine Daten — ETL noch nicht ausgeführt
        </div>
      </div>
    );
  }

  const chartData = buildChartData(data);
  const latest = getLatest(data);
  const latestMonth = formatMonth(
    Object.values(chartData).at(-1)?.month ?? ''
  );

  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
            📈 Preise & Inflation
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            Verbraucherpreisindex · Jahresveränderung (%)
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <span style={{ fontSize: 10.5, color: '#94a3b8' }}>Stand: {latestMonth}</span>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>Quelle: EZB SDMX · ICP Deutschland</span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: '16px 12px 0' }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              interval="preserveStartEnd"
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `${v}%`}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(val: any) => [`${val != null ? Number(val).toFixed(1) : '—'}%`]}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              labelFormatter={(label: any) => formatMonth(String(label))}
              contentStyle={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 8 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            {CATEGORIES.map(cat => (
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                stroke={CATEGORY_COLORS[cat]}
                strokeWidth={cat === 'Gesamt' ? 2.5 : 1.5}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Latest values mini table */}
      <div style={{
        padding: '10px 16px 14px',
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6,
      }}>
        {CATEGORIES.map(cat => {
          const val = latest[cat];
          const color = val == null ? '#94a3b8' : val > 3 ? '#dc2626' : val > 1 ? '#d97706' : val > 0 ? '#2563eb' : '#16a34a';
          return (
            <div key={cat} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 15, fontWeight: 800, color,
                fontVariantNumeric: 'tabular-nums', lineHeight: 1.2,
              }}>
                {val != null ? `${val > 0 ? '+' : ''}${val.toFixed(1)}%` : '—'}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 1.3 }}>
                {cat}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
