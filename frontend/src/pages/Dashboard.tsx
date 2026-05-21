import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { kreisPath } from '../lib/kreis-slugs';
import { useEmployment } from '../hooks/useEmployment';
import { useEtlStatus } from '../hooks/useEtlStatus';
import { BundeslandMap } from '../components/maps/BundeslandMap';
import { EnergyPanel } from '../components/panels/EnergyPanel';
import { InflationPanel } from '../components/panels/InflationPanel';
import { MarketTicker } from '../components/panels/MarketTicker';
import { RequestSection } from '../components/home/RequestSection';
import { api, type SiteStats } from '../lib/api';
import type { WeatherDTO } from '../types/weather';

const TILES: { key: string; icon: string; label: string; iconBg: string; fn: (s: SiteStats) => string }[] = [
  { key: 'energy',   icon: '⚡', label: 'Energiemesspunkte',   iconBg: '#fef3c7', fn: s => s.energyDataPoints >= 1000 ? `${(s.energyDataPoints / 1000).toFixed(1)}k` : String(s.energyDataPoints) },
  { key: 'kreise',   icon: '🗺', label: 'Landkreise mit Daten', iconBg: '#f0fdf4', fn: s => String(s.kreisWithData)  },
  { key: 'sources',  icon: '📡', label: 'Datenquellen online',  iconBg: '#f5f3ff', fn: s => String(s.dataSources)    },
  { key: 'requests', icon: '🗳', label: 'Bürgeranfragen',       iconBg: '#eff6ff', fn: s => String(s.totalRequests)   },
];

function useBreakpoint() {
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { isMobile: width < 640, isTablet: width < 900 };
}

type SortMode = 'alq-desc' | 'alq-asc' | 'name';

const SORT_LABELS: Record<SortMode, string> = {
  'alq-desc': 'ALQ ↓',
  'alq-asc':  'ALQ ↑',
  'name':     'A–Z',
};

function WeatherChip({ ags }: { ags: string }) {
  const [data, setData] = useState<WeatherDTO | null>(null);
  useEffect(() => {
    api.weather.byAgs(ags).then(setData).catch(() => {});
  }, [ags]);
  if (!data) return null;
  const icons: Record<string, string> = { dry: '☀️', fog: '🌫️', rain: '🌧️', snow: '❄️', thunderstorm: '⛈️' };
  const icon = icons[data.condition ?? ''] ?? '🌤️';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
      <span>{icon}</span>
      {data.temperature != null && <strong style={{ color: '#0f172a' }}>{Number(data.temperature).toFixed(0)}°C</strong>}
      {data.windSpeed != null && <span style={{ color: '#94a3b8' }}>· {Number(data.windSpeed).toFixed(0)} km/h</span>}
      <span style={{ color: '#cbd5e1', fontSize: 10 }}>Berlin</span>
    </div>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)   return `vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `vor ${hrs} Std.`;
  const days = Math.floor(hrs / 24);
  return `vor ${days} Tag${days === 1 ? '' : 'en'}`;
}

export function Dashboard() {
  const { isMobile, isTablet } = useBreakpoint();
  const { data: employment, loading: empLoading } = useEmployment();
  const { data: etlStatus } = useEtlStatus();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [kreisSearch, setKreisSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('alq-desc');

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
  }, []);

  // Derived employment insights — computed once when data arrives
  const insights = useMemo(() => {
    const valid = (employment ?? []).filter(d => d.unemploymentRate != null);
    if (!valid.length) return null;
    const avgAlq = (valid.reduce((s, d) => s + d.unemploymentRate!, 0) / valid.length).toFixed(1);
    const sorted = [...valid].sort((a, b) => a.unemploymentRate! - b.unemploymentRate!);
    const best  = sorted[0];
    const worst = sorted[sorted.length - 1];
    const totalUnemployed = (employment ?? []).reduce((s, d) => s + (d.unemployed ?? 0), 0);
    const highAlq = valid.filter(d => d.unemploymentRate! >= 10).length;
    const spread = worst && best ? (worst.unemploymentRate! - best.unemploymentRate!).toFixed(1) : null;
    return { avgAlq, best, worst, totalUnemployed, highAlq, spread };
  }, [employment]);

  const filteredKreise = useMemo(() => {
    const q = kreisSearch.toLowerCase();
    const base = (employment ?? []).filter(d =>
      d.districtName.toLowerCase().includes(q) || d.ags.includes(q)
    );
    return [...base].sort((a, b) => {
      if (sortMode === 'name')     return a.districtName.localeCompare(b.districtName, 'de');
      if (sortMode === 'alq-asc')  return (a.unemploymentRate ?? 99) - (b.unemploymentRate ?? 99);
      return (b.unemploymentRate ?? 0) - (a.unemploymentRate ?? 0);
    });
  }, [employment, kreisSearch, sortMode]);

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-4">

      {/* ── Page title ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold tracking-tight m-0">Übersicht</h1>
            <span className="badge badge-success badge-sm font-bold">LIVE</span>
          </div>
          <p className="text-sm text-base-content/50 m-0">Echtzeit-Daten aus amtlichen deutschen Quellen</p>
        </div>
        <div className="flex items-center gap-3">
          <WeatherChip ags="11000" />
          <a href="/share" className="btn btn-sm btn-outline btn-primary gap-1.5">
            ↗ Teilen
          </a>
        </div>
      </div>

      {/* ── Market ticker ──────────────────────────────────────────── */}
      <MarketTicker />

      {/* ── Stat tiles ─────────────────────────────────────────────── */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {TILES.map(t => (
          <div key={t.key} className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200">
            <div className="card-body p-5 gap-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: t.iconBg }}>
                {t.icon}
              </div>
              <div className="text-3xl font-extrabold tracking-tight tabular-nums leading-none">
                {stats ? t.fn(stats) : <div className="skeleton h-7 w-14 rounded" />}
              </div>
              <div className="text-xs text-base-content/50 font-medium">{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Insights strip ─────────────────────────────────────────── */}
      <div className={`grid gap-px bg-base-200 rounded-xl overflow-hidden border border-base-200 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {[
          { label: 'Ø Arbeitslosenquote', icon: '📊', value: empLoading ? null : (insights ? `${insights.avgAlq} %` : '—'), sub: 'Bundesweiter Durchschnitt' },
          { label: 'Niedrigste ALQ', icon: '🏆', value: empLoading ? null : (insights?.best ? `${insights.best.unemploymentRate} %` : '—'), sub: empLoading ? '' : (insights?.best?.districtName ?? ''), onClick: insights?.best ? () => navigate(kreisPath(insights.best!.ags)) : undefined },
          { label: 'Höchste ALQ', icon: '⚠️', value: empLoading ? null : (insights?.worst ? `${insights.worst.unemploymentRate} %` : '—'), sub: empLoading ? '' : (insights?.worst?.districtName ?? ''), onClick: insights?.worst ? () => navigate(kreisPath(insights.worst!.ags)) : undefined },
          { label: 'Gesamt Arbeitslose', icon: '👥', value: empLoading ? null : (insights ? (insights.totalUnemployed >= 1_000_000 ? `${(insights.totalUnemployed / 1_000_000).toFixed(2)} Mio.` : `${(insights.totalUnemployed / 1000).toFixed(0)}k`) : '—'), sub: 'Alle erfassten Kreise' },
          { label: 'ALQ ≥ 10 % (krit.)', icon: '🔴', value: empLoading ? null : (insights ? String(insights.highAlq) : '—'), sub: 'Kreise mit hoher Arbeitslosigkeit' },
          { label: 'ALQ-Spanne', icon: '↕️', value: empLoading ? null : (insights?.spread != null ? `${insights.spread} PP` : '—'), sub: empLoading ? '' : (insights?.best && insights?.worst ? `${insights.best.districtName.split(',')[0]} – ${insights.worst.districtName.split(',')[0]}` : '') },
        ].map((item, i) => (
          <div
            key={i}
            onClick={item.onClick}
            className={`bg-base-100 p-3 flex flex-col gap-1 ${item.onClick ? 'cursor-pointer hover:bg-base-50 transition-colors' : ''}`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{item.icon}</span>
              <span className="text-[10.5px] font-semibold text-base-content/40 uppercase tracking-wider">{item.label}</span>
            </div>
            <div className="text-xl font-extrabold tracking-tight tabular-nums leading-tight">
              {item.value == null ? <div className="skeleton h-5 w-14 rounded" /> : item.value}
            </div>
            <div className="text-[11px] text-base-content/40 truncate">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main grid ──────────────────────────────────────────────── */}
      <div className={`grid gap-4 items-start ${isTablet ? 'grid-cols-1' : 'grid-cols-2'}`}>

        {/* Bundesland map */}
        <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-base-200">
            <div>
              <div className="text-[13px] font-semibold">Bundesländer — Arbeitsmarkt</div>
              <div className="text-[11px] text-base-content/40 mt-0.5">Ø ALQ je Bundesland · klicken für Details</div>
            </div>
            <a href="/bundeslaender" className="btn btn-xs btn-ghost btn-primary">Alle →</a>
          </div>
          <BundeslandMap data={employment ?? []} height={556} />
        </div>

        {/* District list + Energy */}
        <div className="flex flex-col gap-4">

          {/* District list */}
          <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-base-200">
              <span className="text-[13px] font-semibold">Aktive Landkreise</span>
              <div className="join">
                {(['alq-desc', 'alq-asc', 'name'] as SortMode[]).map(mode => (
                  <button key={mode} className={`join-item btn btn-xs ${sortMode === mode ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSortMode(mode)}>
                    {SORT_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-base-200 bg-base-50">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0 text-base-content/30">
                <path d="M7 13A6 6 0 1 0 7 1a6 6 0 0 0 0 12ZM14 14l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="search"
                placeholder="Landkreis suchen…"
                value={kreisSearch}
                onChange={e => setKreisSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-xs min-w-0"
              />
              {kreisSearch && (
                <button onClick={() => setKreisSearch('')} className="btn btn-ghost btn-xs btn-circle text-base-content/40">×</button>
              )}
            </div>

            {/* List */}
            <div style={{ height: 300, overflowY: 'auto' }}>
              {empLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5 px-4 py-2.5 border-b border-base-200/50">
                    <div className="skeleton h-2.5 w-3/5 rounded" />
                    <div className="skeleton h-2 w-2/5 rounded" />
                  </div>
                ))
                : filteredKreise.length === 0
                  ? <div className="py-8 text-center text-xs text-base-content/40">Kein Landkreis gefunden für „{kreisSearch}"</div>
                  : filteredKreise.map((d, i) => {
                    const alq = d.unemploymentRate ?? 0;
                    const alqColor = alq >= 10 ? 'text-error' : alq >= 7 ? 'text-warning' : alq >= 4 ? 'text-primary' : 'text-success';
                    return (
                      <button
                        key={d.ags}
                        onClick={() => navigate(kreisPath(d.ags))}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 border-b border-base-200/50 hover:bg-base-50 transition-colors"
                      >
                        <span className="text-[10px] text-base-content/25 tabular-nums w-4 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{d.districtName}</div>
                          <div className="text-[10px] text-base-content/40 mt-0.5">{d.dataDate}</div>
                        </div>
                        <span className={`text-[13px] font-bold tabular-nums shrink-0 ${alqColor}`}>
                          {d.unemploymentRate != null ? `${d.unemploymentRate}%` : '—'}
                        </span>
                      </button>
                    );
                  })
              }
            </div>
          </div>

          <EnergyPanel />
        </div>
      </div>

      {/* ── Inflation ──────────────────────────────────────────────── */}
      <InflationPanel />

      {/* ── ETL status ─────────────────────────────────────────────── */}
      <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-base-200">
          <div>
            <div className="text-[13px] font-semibold">📡 Datenquellen & ETL-Status</div>
            <div className="text-[11px] text-base-content/40 mt-0.5">Letzter Datenabruf je Quelle</div>
          </div>
          {etlStatus && (
            <span className="badge badge-success badge-sm font-bold">
              {etlStatus.filter(s => s.rows > 0).length} / {etlStatus.length} aktiv
            </span>
          )}
        </div>
        <div className="p-4 grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {(etlStatus ?? Array.from({ length: 12 }, (_, i) => ({ name: '', table: String(i), cadence: '', rows: -1, lastUpdated: null }))).map(s => {
            const loading = s.rows === -1;
            const pending = !loading && s.rows === 0;
            const ok      = !loading && s.rows > 0;
            return (
              <div key={s.table} className={`card card-compact border ${pending ? 'border-warning/30 bg-warning/5' : 'border-base-200 bg-base-100'}`}>
                <div className="card-body gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${loading ? 'bg-base-300' : pending ? 'bg-warning' : 'bg-success'}`} />
                    {loading
                      ? <div className="skeleton h-2.5 w-3/4 rounded" />
                      : <span className="text-xs font-semibold leading-tight">{s.name}</span>
                    }
                  </div>
                  {loading
                    ? <div className="skeleton h-5 w-2/5 rounded" />
                    : pending
                      ? <span className="text-sm font-bold text-warning">⏳ Lädt…</span>
                      : <span className="text-lg font-extrabold tabular-nums leading-none">
                          {s.rows.toLocaleString('de-DE')}
                          <span className="text-[10px] font-medium text-base-content/40 ml-1">Zeilen</span>
                        </span>
                  }
                  {!loading && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-base-content/40">{ok ? timeAgo(s.lastUpdated) : '—'}</span>
                      <span className="badge badge-ghost badge-xs">{s.cadence}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Request section ────────────────────────────────────────── */}
      <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200 overflow-hidden" id="anfragen">
        <div className="px-4 py-3 border-b border-base-200">
          <div className="text-[13px] font-semibold">Landkreis anfragen</div>
          <div className="text-[11px] text-base-content/40 mt-0.5">Stimm ab — wir priorisieren nach Anfragen</div>
        </div>
        <RequestSection embedded />
      </div>

    </div>
  );
}
