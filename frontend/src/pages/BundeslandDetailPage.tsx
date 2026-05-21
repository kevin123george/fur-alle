import { useMemo, useState } from 'react';
import { AnimatedNumber } from '../components/common/AnimatedNumber';
import { useParams, Link } from 'react-router-dom';
import { useEmployment } from '../hooks/useEmployment';
import { kreisPath } from '../lib/kreis-slugs';
import { useClusters } from '../hooks/useClusters';
import { useMapOverlay, OVERLAY_METRICS, type OverlayMetricKey } from '../hooks/useMapOverlay';
import { useVacanciesAll } from '../hooks/useVacanciesAll';
import { KreisMap } from '../components/maps/KreisMap';
import { BL_META, slugToCode, codeToSlug } from '../lib/bundeslaender';

type ColorMode = 'alq' | 'cluster' | 'overlay';

function alqColor(v: number | null | undefined) {
  if (v == null) return '#94a3b8';
  if (v >= 10) return '#ef4444';
  if (v >= 7)  return '#f97316';
  if (v >= 4)  return '#eab308';
  return '#22c55e';
}
function fmt1(v: number | null | undefined) {
  return v == null ? '—' : v.toFixed(1);
}
function fmtBig(v: number | null | undefined) {
  if (v == null) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} Mio.`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}k`;
  return String(v);
}

export function BundeslandDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const code = slugToCode(slug ?? '') ?? slug ?? '';
  const { data: employment } = useEmployment();
  const { data: clusters } = useClusters();
  const { data: allVacancies } = useVacanciesAll();
  const [colorMode, setColorMode] = useState<ColorMode>('alq');
  const [overlayMetric, setOverlayMetric] = useState<OverlayMetricKey>('gdp');
  const [kreisSort, setKreisSort] = useState<'alq_asc' | 'alq_desc' | 'alpha' | 'unemployed'>('alq_asc');
  const { data: overlayData } = useMapOverlay(colorMode === 'overlay' ? overlayMetric : null);
  const overlayMeta = OVERLAY_METRICS.find(m => m.key === overlayMetric) ?? null;

  const meta = BL_META[code ?? ''] ?? { name: code ?? '?', abbr: '??' };

  const blData = useMemo(() => {
    if (!employment || !code) return null;
    const kreise = employment.filter(e => e.ags.startsWith(code));
    const valid = kreise.filter(e => e.unemploymentRate != null);
    const avgAlq = valid.length ? valid.reduce((s, e) => s + e.unemploymentRate!, 0) / valid.length : null;
    const byAlq = [...valid].sort((a, b) => a.unemploymentRate! - b.unemploymentRate!);
    const best  = byAlq[0] ?? null;
    const worst = byAlq[byAlq.length - 1] ?? null;
    const totalUnemployed = kreise.reduce((s, e) => s + (e.unemployed ?? 0), 0);
    const criticalCount   = valid.filter(e => e.unemploymentRate! >= 10).length;
    const tiers = [
      { label: '< 4 %',  color: '#22c55e', count: valid.filter(e => e.unemploymentRate! < 4).length },
      { label: '4–7 %',  color: '#eab308', count: valid.filter(e => e.unemploymentRate! >= 4 && e.unemploymentRate! < 7).length },
      { label: '7–10 %', color: '#f97316', count: valid.filter(e => e.unemploymentRate! >= 7 && e.unemploymentRate! < 10).length },
      { label: '≥ 10 %', color: '#ef4444', count: valid.filter(e => e.unemploymentRate! >= 10).length },
    ];
    const dataDate = kreise[0]?.dataDate ?? null;
    return { kreise, avgAlq, best, worst, totalUnemployed, criticalCount, tiers, dataDate };
  }, [employment, code]);

  const kreisSorted = useMemo(() => {
    if (!blData) return [];
    return [...blData.kreise].sort((a, b) => {
      if (kreisSort === 'alpha')      return a.districtName.localeCompare(b.districtName, 'de');
      if (kreisSort === 'alq_desc')   return (b.unemploymentRate ?? 0) - (a.unemploymentRate ?? 0);
      if (kreisSort === 'unemployed') return (b.unemployed ?? 0) - (a.unemployed ?? 0);
      if (a.unemploymentRate == null) return 1;
      if (b.unemploymentRate == null) return -1;
      return a.unemploymentRate - b.unemploymentRate;
    });
  }, [blData, kreisSort]);

  const blEmployment = useMemo(
    () => (employment ?? []).filter(e => e.ags.startsWith(code ?? '')),
    [employment, code]
  );

  const blClusters = useMemo(
    () => clusters.filter(c => c.ags.startsWith(code ?? '')),
    [clusters, code]
  );

  const blOverlayData = useMemo(
    () => overlayData.filter(o => o.ags.startsWith(code ?? '')),
    [overlayData, code]
  );

  const vacanciesData = useMemo(() => {
    if (!allVacancies || !code) return null;
    const blVac = allVacancies.filter(v => v.ags.startsWith(code));
    if (!blVac.length) return null;
    const hasData = blVac.some(v => v.openPositions != null || v.reportedPositions != null);
    if (!hasData) return null;
    const totalOpen     = blVac.reduce((s, v) => s + (v.openPositions ?? 0), 0);
    const totalReported = blVac.reduce((s, v) => s + (v.reportedPositions ?? 0), 0);
    const withDays      = blVac.filter(v => v.avgVacancyDays != null);
    const avgDays       = withDays.length
      ? withDays.reduce((s, v) => s + v.avgVacancyDays!, 0) / withDays.length
      : null;
    const sorted = [...blVac]
      .filter(v => v.openPositions != null)
      .sort((a, b) => (b.openPositions ?? 0) - (a.openPositions ?? 0));
    const dataDate = blVac[0]?.dataDate ?? null;
    return { totalOpen, totalReported, avgDays, sorted, dataDate };
  }, [allVacancies, code]);

  if (!employment) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-dots loading-md text-base-content/30" />
      </div>
    );
  }

  if (!blData || blData.kreise.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-4 text-base-content/40 text-sm">
        <span>Keine Daten für dieses Bundesland gefunden.</span>
        <Link to="/bundeslaender" className="btn btn-sm btn-ghost text-primary">← Zurück zur Übersicht</Link>
      </div>
    );
  }

  const color = alqColor(blData.avgAlq);

  return (
    <div className="bg-base-200/30">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative px-7 pt-6 pb-9" style={{
        background: code
          ? `linear-gradient(rgba(4,8,22,0.70), rgba(4,8,22,0.70)), url(/posters/${code}.png) center top / auto no-repeat, #060d1f`
          : undefined,
      }}>
        <div className="max-w-[1200px] mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-5">
            <Link to="/bundeslaender" className="flex items-center gap-1 text-xs font-semibold text-white/70 no-underline px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm hover:bg-white/15 transition-colors">
              ← Bundesländer
            </Link>
            <span className="text-xs text-white/25">/</span>
            <span className="text-[13px] font-bold text-white">{meta.name}</span>
            <span className="text-[11px] font-extrabold text-white px-2 py-0.5 rounded-md bg-white/15 border border-white/20 backdrop-blur-sm tracking-wide">
              {meta.abbr}
            </span>
          </div>

          {/* Hero row */}
          <div className="flex items-center gap-5 mb-5 flex-wrap">
            {meta.wappen && (
              <div className="w-14 h-[72px] shrink-0">
                <img
                  src={meta.wappen}
                  alt=""
                  className="w-full h-full object-contain block"
                  style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-[30px] font-black text-white m-0 mb-0.5 tracking-tight">{meta.name}</h1>
              {meta.tagline && (
                <div className="text-[13px] text-blue-300 italic font-medium mb-1">{meta.tagline}</div>
              )}
              <p className="m-0 text-xs text-white/45 font-medium">
                {blData.kreise.length} Landkreise · Arbeitsmarkt {blData.dataDate ? `(Stand: ${blData.dataDate})` : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black tabular-nums leading-none tracking-tighter" style={{ color }}>
                <AnimatedNumber value={blData.avgAlq} format={n => n.toFixed(1)} />
              </div>
              <div className="text-xs text-white/45 font-bold mt-0.5">% Ø Arbeitslosenquote</div>
            </div>
          </div>

          {/* Summary stat cards */}
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            {([
              { label: 'Arbeitslose gesamt', raw: blData.totalUnemployed,              c: '#60a5fa',  fmt: (n: number) => fmtBig(n) },
              { label: 'Kreise ≥ 10 % ALQ',  raw: blData.criticalCount,               c: blData.criticalCount > 0 ? '#f87171' : '#4ade80', fmt: (n: number) => String(Math.round(n)) },
              { label: 'Niedrigste ALQ',      raw: blData.best?.unemploymentRate ?? null, c: '#4ade80', fmt: (n: number) => `${n.toFixed(1)} %` },
              { label: 'Höchste ALQ',         raw: blData.worst?.unemploymentRate ?? null, c: '#f87171', fmt: (n: number) => `${n.toFixed(1)} %` },
            ] as { label: string; raw: number | null; c: string; fmt: (n: number) => string }[]).map(s => (
              <div key={s.label} className="px-4 py-3 rounded-xl backdrop-blur-[10px]" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="text-xl font-extrabold tabular-nums leading-tight" style={{ color: s.c }}>
                  <AnimatedNumber value={s.raw} format={s.fmt} />
                </div>
                <div className="text-[10.5px] text-white/40 mt-1 font-semibold">{s.label}</div>
              </div>
            ))}
          </div>

        </div>
        {/* Fade to page bg */}
        {code && <div className="absolute bottom-0 left-0 right-0 h-[72px] pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, oklch(var(--b2, var(--b1)) / 0.3))' }} />}
      </div>

      <div className="px-7 pt-6 pb-16 max-w-[1200px] mx-auto">

        {/* ── Main 2-col layout ──────────────────────────────────── */}
        <div className="grid gap-5 mb-6 items-start bl-main-grid" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>

          {/* Map */}
          <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap px-3.5 py-2.5 border-b border-base-200">
              <div className="join">
                {([
                  { key: 'alq',     label: 'ALQ' },
                  { key: 'cluster', label: 'Kreistypen' },
                  { key: 'overlay', label: 'Indikator' },
                ] as { key: ColorMode; label: string }[]).map(m => (
                  <button
                    key={m.key}
                    className={`join-item btn btn-xs ${colorMode === m.key ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setColorMode(m.key)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {colorMode === 'overlay' && (
                <div className="join">
                  {OVERLAY_METRICS.map(m => (
                    <button
                      key={m.key}
                      className={`join-item btn btn-xs ${overlayMetric === m.key ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setOverlayMetric(m.key as OverlayMetricKey)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <KreisMap
              data={blEmployment}
              interactive
              height={typeof window !== 'undefined' && window.innerWidth < 768 ? 260 : 430}
              fitBL={code}
              colorMode={colorMode}
              clusterData={colorMode === 'cluster' ? blClusters : undefined}
              overlayData={colorMode === 'overlay' ? blOverlayData : undefined}
              overlayMeta={colorMode === 'overlay' ? (overlayMeta ?? undefined) : undefined}
              showLegend
            />
          </div>

          {/* Stats panel */}
          <div className="flex flex-col gap-3.5">

            {/* Distribution */}
            <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200 p-4">
              <div className="text-[11px] font-bold text-base-content/40 uppercase tracking-widest mb-3">Verteilung der Kreise</div>
              {blData.tiers.map(t => (
                <div key={t.label} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-base-content/60">{t.label}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: t.color }}>{t.count} Kreise</span>
                  </div>
                  <div className="h-1.5 bg-base-200 rounded overflow-hidden">
                    <div className="h-full rounded opacity-85 transition-[width] duration-300"
                      style={{
                        width: `${blData.kreise.length ? (t.count / blData.kreise.length) * 100 : 0}%`,
                        background: t.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Best / worst */}
            <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200 p-4">
              <div className="text-[11px] font-bold text-base-content/40 uppercase tracking-widest mb-3">Ausreißer</div>
              <div className="mb-3">
                <div className="text-[9px] font-bold text-success uppercase tracking-widest mb-1.5">Niedrigste Arbeitslosigkeit</div>
                <Link to={blData.best?.ags ? kreisPath(blData.best.ags) : '#'} className="no-underline">
                  <div className="bg-success/10 rounded-lg p-2.5 flex justify-between items-center hover:bg-success/15 transition-colors cursor-pointer">
                    <div>
                      <div className="text-[13px] font-bold text-success">{blData.best?.districtName ?? '—'}</div>
                      <div className="text-[10px] text-base-content/40 mt-0.5">→ Kreis-Details</div>
                    </div>
                    <div className="text-[22px] font-black text-success tabular-nums">{fmt1(blData.best?.unemploymentRate)} %</div>
                  </div>
                </Link>
              </div>
              <div>
                <div className="text-[9px] font-bold text-error uppercase tracking-widest mb-1.5">Höchste Arbeitslosigkeit</div>
                <Link to={blData.worst?.ags ? kreisPath(blData.worst.ags) : '#'} className="no-underline">
                  <div className="bg-error/10 rounded-lg p-2.5 flex justify-between items-center hover:bg-error/15 transition-colors cursor-pointer">
                    <div>
                      <div className="text-[13px] font-bold text-error">{blData.worst?.districtName ?? '—'}</div>
                      <div className="text-[10px] text-base-content/40 mt-0.5">→ Kreis-Details</div>
                    </div>
                    <div className="text-[22px] font-black text-error tabular-nums">{fmt1(blData.worst?.unemploymentRate)} %</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Other Bundesländer */}
            <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200 p-3.5">
              <div className="text-[11px] font-bold text-base-content/40 uppercase tracking-widest mb-2.5">Andere Bundesländer</div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(BL_META)
                  .filter(([c]) => c !== code)
                  .map(([c, m]) => (
                    <Link key={c} to={`/bundeslaender/${codeToSlug(c)}`} className="no-underline">
                      <span className="btn btn-xs btn-ghost border border-base-200 font-bold">{m.abbr}</span>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Kreise card grid ───────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-base-content">Alle Landkreise</span>
            <div className="join">
              {([
                { key: 'alq_asc',    label: 'ALQ ↑' },
                { key: 'alq_desc',   label: 'ALQ ↓' },
                { key: 'alpha',      label: 'A–Z' },
                { key: 'unemployed', label: 'Arbeitslose' },
              ] as { key: typeof kreisSort; label: string }[]).map(o => (
                <button key={o.key} className={`join-item btn btn-xs ${kreisSort === o.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setKreisSort(o.key)}>
                  {o.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-base-content/40 ml-auto">{kreisSorted.length} Einträge</span>
          </div>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {kreisSorted.map((k, i) => (
              <Link key={k.ags} to={kreisPath(k.ags)} className="no-underline">
                <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 hover:-translate-y-0.5 transition-all duration-200 p-4 h-full flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[10px] font-bold text-base-content/30 tabular-nums mt-0.5">#{i + 1}</span>
                    <div className="text-xl font-black tabular-nums leading-none text-right" style={{ color: alqColor(k.unemploymentRate) }}>
                      {kreisSort === 'unemployed'
                        ? fmtBig(k.unemployed)
                        : <>{fmt1(k.unemploymentRate)}<span className="text-sm font-bold"> %</span></>}
                    </div>
                  </div>
                  <div className="text-[12px] font-semibold text-base-content/70 leading-tight flex-1">
                    {k.districtName}
                  </div>
                  <div className="h-1 bg-base-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: kreisSort === 'unemployed'
                        ? `${Math.min(100, ((k.unemployed ?? 0) / (kreisSorted[0]?.unemployed ?? 1)) * 100)}%`
                        : `${Math.min(100, ((k.unemploymentRate ?? 0) / 15) * 100)}%`,
                      background: alqColor(k.unemploymentRate),
                    }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Offene Stellen panel ───────────────────────────────── */}
        {vacanciesData && (
          <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200 overflow-hidden mt-5">
            <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3.5 border-b border-base-200">
              <div>
                <span className="text-sm font-bold text-base-content">💼 Offene Stellen</span>
                <span className="text-[11px] text-base-content/40 ml-2">Bundesagentur für Arbeit{vacanciesData.dataDate ? ` · Stand: ${vacanciesData.dataDate}` : ''}</span>
              </div>
              <div className="flex gap-4">
                {([
                  { label: 'Offene Stellen',    raw: vacanciesData.totalOpen,     color: 'text-primary',           fmt: (n: number) => Math.round(n).toLocaleString('de-DE') },
                  { label: 'Gemeldete Stellen', raw: vacanciesData.totalReported, color: 'text-base-content/60',   fmt: (n: number) => Math.round(n).toLocaleString('de-DE') },
                  { label: 'Ø Vakanzdauer',     raw: vacanciesData.avgDays,       color: 'text-warning',           fmt: (n: number) => `${Math.round(n)} Tage` },
                ] as { label: string; raw: number | null; color: string; fmt: (n: number) => string }[]).map(s => (
                  <div key={s.label} className="text-right">
                    <div className={`text-base font-extrabold tabular-nums leading-tight ${s.color}`}>
                      <AnimatedNumber value={s.raw} format={s.fmt} />
                    </div>
                    <div className="text-[10px] text-base-content/40 font-semibold mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2">
              {vacanciesData.sorted.map((v, i) => {
                const maxOpen = vacanciesData.sorted[0]?.openPositions ?? 1;
                return (
                  <Link key={v.ags} to={kreisPath(v.ags)} className="no-underline">
                    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-base-100 hover:bg-base-200/50 transition-colors ${i % 2 === 0 ? 'border-r border-base-100' : ''}`}>
                      <div className="w-[22px] h-[22px] rounded-full bg-base-200 flex items-center justify-center text-[9.5px] font-extrabold text-base-content/40 shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-base-content/70 truncate">{v.districtName}</div>
                        <div className="h-[3px] bg-base-200 rounded overflow-hidden mt-1">
                          <div className="h-full rounded opacity-70" style={{
                            width: `${Math.min(100, ((v.openPositions ?? 0) / maxOpen) * 100)}%`,
                            background: '#2563eb',
                          }} />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-extrabold text-primary tabular-nums">
                          <AnimatedNumber value={v.openPositions ?? 0} format={n => Math.round(n).toLocaleString('de-DE')} duration={600} />
                        </div>
                        {v.avgVacancyDays != null && (
                          <div className="text-[9.5px] text-base-content/40 font-semibold mt-0.5">
                            <AnimatedNumber value={Number(v.avgVacancyDays)} format={n => `${Math.round(n)} Tage`} duration={600} />
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
