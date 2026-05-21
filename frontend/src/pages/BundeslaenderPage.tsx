import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmployment } from '../hooks/useEmployment';
import { BL_META, codeToSlug } from '../lib/bundeslaender';

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
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
}

type SortKey = 'alpha' | 'alq_asc' | 'alq_desc' | 'kreise';

export function BundeslaenderPage() {
  const { data: employment } = useEmployment();
  const [sort, setSort] = useState<SortKey>('alq_asc');

  const bundeslaender = useMemo(() => {
    if (!employment) return [];
    const map = new Map<string, { code: string; kreise: { ags: string; districtName: string; unemploymentRate: number | null; unemployed: number | null }[] }>();
    for (const d of employment) {
      const code = d.ags.slice(0, 2);
      if (!map.has(code)) map.set(code, { code, kreise: [] });
      map.get(code)!.kreise.push({ ags: d.ags, districtName: d.districtName, unemploymentRate: d.unemploymentRate, unemployed: d.unemployed });
    }
    const result = Array.from(map.values()).map(bl => {
      const meta = BL_META[bl.code] ?? { name: bl.code, abbr: bl.code };
      const valid = bl.kreise.filter(k => k.unemploymentRate != null);
      const avgAlq = valid.length ? valid.reduce((s, k) => s + k.unemploymentRate!, 0) / valid.length : null;
      const byAlq  = [...valid].sort((a, b) => a.unemploymentRate! - b.unemploymentRate!);
      const best   = byAlq[0] ?? null;
      const worst  = byAlq[byAlq.length - 1] ?? null;
      const totalUnemployed = bl.kreise.reduce((s, k) => s + (k.unemployed ?? 0), 0);
      const criticalCount = valid.filter(k => k.unemploymentRate! >= 10).length;
      const tiers = [
        { color: '#22c55e', count: valid.filter(k => k.unemploymentRate! < 4).length },
        { color: '#eab308', count: valid.filter(k => k.unemploymentRate! >= 4 && k.unemploymentRate! < 7).length },
        { color: '#f97316', count: valid.filter(k => k.unemploymentRate! >= 7 && k.unemploymentRate! < 10).length },
        { color: '#ef4444', count: valid.filter(k => k.unemploymentRate! >= 10).length },
      ];
      return { code: bl.code, name: meta.name, abbr: meta.abbr, kreiseCount: bl.kreise.length, avgAlq, best, worst, totalUnemployed, criticalCount, tiers };
    });
    return result.sort((a, b) => {
      if (sort === 'alpha')    return a.name.localeCompare(b.name, 'de');
      if (sort === 'alq_asc')  return (a.avgAlq ?? 99) - (b.avgAlq ?? 99);
      if (sort === 'alq_desc') return (b.avgAlq ?? 0)  - (a.avgAlq ?? 0);
      if (sort === 'kreise')   return b.kreiseCount - a.kreiseCount;
      return 0;
    });
  }, [employment, sort]);

  const national = useMemo(() => {
    if (!bundeslaender.length) return null;
    const allAvg = bundeslaender.filter(bl => bl.avgAlq != null);
    const avgAlq = allAvg.length ? allAvg.reduce((s, bl) => s + bl.avgAlq!, 0) / allAvg.length : null;
    const totalKreise = bundeslaender.reduce((s, bl) => s + bl.kreiseCount, 0);
    const criticalTotal = bundeslaender.reduce((s, bl) => s + bl.criticalCount, 0);
    const bestBL  = [...bundeslaender].sort((a, b) => (a.avgAlq ?? 99) - (b.avgAlq ?? 99))[0];
    const worstBL = [...bundeslaender].sort((a, b) => (b.avgAlq ?? 0) - (a.avgAlq ?? 0))[0];
    return { avgAlq, totalKreise, criticalTotal, bestBL, worstBL };
  }, [bundeslaender]);

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'alq_asc',  label: 'ALQ ↑' },
    { key: 'alq_desc', label: 'ALQ ↓' },
    { key: 'alpha',    label: 'A–Z' },
    { key: 'kreise',   label: 'Kreise' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto pb-16">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight mb-1">Bundesländer</h1>
        <p className="text-sm text-base-content/50 m-0">
          Arbeitsmarkt-Übersicht aller 16 Bundesländer · Klicken für Details & Kreiskarte
        </p>
      </div>

      {/* ── National summary ───────────────────────────────────────── */}
      {national && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Ø ALQ Bund',        value: `${fmt1(national.avgAlq)} %`,          color: alqColor(national.avgAlq) },
            { label: 'Landkreise gesamt',  value: String(national.totalKreise),            color: '#3b82f6' },
            { label: 'Kreise ALQ ≥ 10 %', value: String(national.criticalTotal),          color: '#ef4444' },
            { label: 'Bestes Bundesland',  value: national.bestBL  ? `${national.bestBL.abbr} ${fmt1(national.bestBL.avgAlq)} %`  : '—', color: '#22c55e' },
            { label: 'Schwächstes BL',     value: national.worstBL ? `${national.worstBL.abbr} ${fmt1(national.worstBL.avgAlq)} %` : '—', color: '#ef4444' },
          ].map(s => (
            <div key={s.label} className="card bg-base-100 border border-base-200 shadow-sm p-4">
              <div className="text-lg font-extrabold tabular-nums leading-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10.5px] text-base-content/40 font-semibold mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Sort controls ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="text-[11px] font-semibold text-base-content/40 uppercase tracking-wider">Sortierung</span>
        <div className="join">
          {SORT_OPTIONS.map(o => (
            <button key={o.key} className={`join-item btn btn-xs ${sort === o.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSort(o.key)}>
              {o.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-base-content/25 ml-auto">Klicken für Kreis-Details</span>
      </div>

      {/* ── Loading ────────────────────────────────────────────────── */}
      {!employment && (
        <div className="flex justify-center py-16">
          <span className="loading loading-dots loading-md text-base-content/30" />
        </div>
      )}

      {/* ── Cards grid ─────────────────────────────────────────────── */}
      {employment && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {bundeslaender.map((bl, i) => {
            const c = alqColor(bl.avgAlq);
            const totalTiers = bl.tiers.reduce((s, t) => s + t.count, 0);
            return (
              <Link key={bl.code} to={`/bundeslaender/${codeToSlug(bl.code)}`} className="no-underline block">
                <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer h-full">
                  <div className="card-body p-4 gap-3">

                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-12 shrink-0">
                          <img src={BL_META[bl.code]?.wappen} alt="" className="w-full h-full object-contain"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                          <div className="absolute -bottom-1 -right-2 w-4 h-4 rounded-full bg-base-200 flex items-center justify-center text-[8px] font-bold text-base-content/50">
                            {i + 1}
                          </div>
                        </div>
                        <div>
                          <div className="text-[15px] font-extrabold tracking-tight leading-tight">{bl.name}</div>
                          {BL_META[bl.code]?.tagline && (
                            <div className="text-[10px] text-primary italic font-medium mt-0.5">{BL_META[bl.code].tagline}</div>
                          )}
                          <div className="text-[10.5px] text-base-content/40 font-medium mt-1">
                            {bl.kreiseCount} Landkreise · {fmtBig(bl.totalUnemployed)} Arbeitslose
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-neutral text-[10.5px] font-bold shrink-0">{bl.abbr}</span>
                    </div>

                    {/* ALQ hero */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-black tabular-nums leading-none" style={{ color: c }}>{fmt1(bl.avgAlq)}</span>
                      <span className="text-sm font-bold text-base-content/40">% Ø ALQ</span>
                      {bl.criticalCount > 0 && (
                        <span className="badge badge-error badge-sm ml-auto">{bl.criticalCount} kritisch</span>
                      )}
                    </div>

                    {/* Distribution bar */}
                    <div className="h-1.5 rounded-full overflow-hidden flex gap-px">
                      {bl.tiers.map((t, ti) => t.count > 0 ? (
                        <div key={ti} style={{ flex: t.count, background: t.color, opacity: 0.85 }} />
                      ) : null)}
                      {totalTiers === 0 && <div className="flex-1 bg-base-300" />}
                    </div>

                    {/* Best / worst */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-success/10 rounded-lg p-2">
                        <div className="text-[8px] font-bold text-success uppercase tracking-wider mb-1">Niedrigste</div>
                        <div className="text-sm font-extrabold text-success tabular-nums">{fmt1(bl.best?.unemploymentRate)} %</div>
                        <div className="text-[9.5px] text-base-content/50 truncate mt-0.5">{bl.best?.districtName ?? '—'}</div>
                      </div>
                      <div className="bg-error/10 rounded-lg p-2">
                        <div className="text-[8px] font-bold text-error uppercase tracking-wider mb-1">Höchste</div>
                        <div className="text-sm font-extrabold text-error tabular-nums">{fmt1(bl.worst?.unemploymentRate)} %</div>
                        <div className="text-[9.5px] text-base-content/50 truncate mt-0.5">{bl.worst?.districtName ?? '—'}</div>
                      </div>
                    </div>

                    <div className="text-right text-[10.5px] font-bold text-primary">Details & Kreiskarte →</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
