import { useMarkets } from '../../hooks/useMarkets';

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', JPY: '¥',
};

function fmt(price: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? '';
  if (price >= 1000) return `${sym}${price.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`;
  if (price >= 10)   return `${sym}${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${sym}${price.toLocaleString('de-DE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
}

export function MarketTicker() {
  const { data, lastRefresh } = useMarkets();

  if (!data || data.length === 0) {
    return (
      <div style={{
        background: '#0f172a', borderRadius: 10, padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
        overflowX: 'auto',
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ width: 90, height: 32, background: 'rgba(255,255,255,0.08)', borderRadius: 6, flexShrink: 0 }} />
        ))}
      </div>
    );
  }

  const refreshStr = lastRefresh
    ? lastRefresh.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div style={{
      background: '#0f172a', borderRadius: 10, marginBottom: 14,
      padding: '0 16px',
      display: 'flex', alignItems: 'stretch', gap: 0,
      overflowX: 'auto',
    }}>
      {/* Label */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '10px 14px 10px 0',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Märkte
        </span>
      </div>

      {/* Quotes */}
      {data.map((q, i) => {
        const up = q.changePct >= 0;
        const color = up ? '#22c55e' : '#ef4444';
        const arrow = up ? '▲' : '▼';
        const isLast = i === data.length - 1;
        return (
          <div
            key={q.symbol}
            style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              padding: '8px 16px',
              borderRight: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0, minWidth: 100,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', marginBottom: 2 }}>
              {q.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(q.price, q.currency)}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {arrow} {Math.abs(q.changePct).toFixed(2)}%
              </span>
            </div>
          </div>
        );
      })}

      {/* Refresh time */}
      <div style={{
        marginLeft: 'auto', display: 'flex', alignItems: 'center',
        padding: '0 0 0 16px', flexShrink: 0,
        borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: 9.5, color: '#475569', whiteSpace: 'nowrap' }}>
          {refreshStr} · Yahoo Finance
        </span>
      </div>
    </div>
  );
}
