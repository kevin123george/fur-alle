import { forwardRef, useEffect, useState } from 'react';
import type { EmploymentDTO } from '../../types/employment';
import type { ClusterDTO } from '../../types/cluster';
import type { OverlayPoint } from '../../hooks/useMapOverlay';
import { BRAND } from '../../lib/brand';

export type HomeVariant = 'overview' | 'map_alq' | 'map_cluster' | 'map_overlay' | 'top10';
export interface OverlayMeta { key: string; label: string; unit: string; higherIsBetter: boolean; }

interface Props {
  variant?: HomeVariant;
  employment: EmploymentDTO[];
  clusters?: ClusterDTO[];
  overlayData?: OverlayPoint[];
  overlayMeta?: OverlayMeta | null;
}

function n(v: number | null | undefined, d = 1) {
  return v == null ? '—' : Number(v).toFixed(d);
}
function big(v: number | null | undefined) {
  if (v == null) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} Mio.`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

const ALQ_TIERS = [
  { min: 10, fill: 'rgba(220,38,38,0.88)',  stroke: 'rgba(239,68,68,0.5)',  label: '≥ 10 %', dot: '#ef4444' },
  { min: 7,  fill: 'rgba(234,88,12,0.85)',  stroke: 'rgba(249,115,22,0.5)', label: '7–10 %', dot: '#f97316' },
  { min: 4,  fill: 'rgba(202,138,4,0.82)',  stroke: 'rgba(234,179,8,0.45)', label: '4–7 %',  dot: '#eab308' },
  { min: 0,  fill: 'rgba(21,128,61,0.82)',  stroke: 'rgba(34,197,94,0.4)',  label: '< 4 %',  dot: '#22c55e' },
];

function alqTier(alq: number | null | undefined) {
  if (alq == null) return null;
  return ALQ_TIERS.find(t => alq >= t.min) ?? ALQ_TIERS[ALQ_TIERS.length - 1];
}
function alqFill(alq: number | null | undefined) {
  return alqTier(alq)?.fill ?? 'rgba(255,255,255,0.04)';
}
function alqStroke(alq: number | null | undefined) {
  return alqTier(alq)?.stroke ?? 'rgba(255,255,255,0.08)';
}

const OVERLAY_STOPS = [
  { fill: 'rgba(30,58,138,0.85)',  stroke: 'rgba(59,130,246,0.35)',  label: '1. Fünftel' },
  { fill: 'rgba(59,130,246,0.85)', stroke: 'rgba(96,165,250,0.4)',   label: '2. Fünftel' },
  { fill: 'rgba(16,185,129,0.85)', stroke: 'rgba(52,211,153,0.4)',   label: '3. Fünftel' },
  { fill: 'rgba(234,179,8,0.85)',  stroke: 'rgba(250,204,21,0.4)',   label: '4. Fünftel' },
  { fill: 'rgba(220,38,38,0.88)',  stroke: 'rgba(239,68,68,0.45)',   label: '5. Fünftel' },
];

function buildOverlayLookup(data: OverlayPoint[], higherIsBetter: boolean): Map<string, number> {
  const sorted = [...data].sort((a, b) => a.value - b.value);
  const total = sorted.length;
  const lookup = new Map<string, number>();
  sorted.forEach((p, i) => {
    const quintile = Math.min(4, Math.floor((i / total) * 5));
    lookup.set(p.ags, higherIsBetter ? quintile : 4 - quintile);
  });
  return lookup;
}

type MapPath = { path: string; ags: string };
const GERMANY = { latMin: 47.27, latMax: 55.06, lonMin: 5.87, lonMax: 15.04 };

function useGermanyPaths() {
  const [paths, setPaths] = useState<MapPath[]>([]);
  useEffect(() => {
    fetch('/kreise.geo.json')
      .then(r => r.json())
      .then((geo: { features: { properties: { krs_code: string[] }; geometry: { type: string; coordinates: number[][][][] | number[][][] } }[] }) => {
        const W = 460, H = 460, pad = 8;
        const { latMin, latMax, lonMin, lonMax } = GERMANY;
        const scaleX = (W - pad * 2) / (lonMax - lonMin);
        const scaleY = (H - pad * 2) / (latMax - latMin);
        const scale = Math.min(scaleX, scaleY);
        const offX = pad + ((W - pad * 2) - (lonMax - lonMin) * scale) / 2;
        const offY = pad + ((H - pad * 2) - (latMax - latMin) * scale) / 2;
        const proj = (lon: number, lat: number) =>
          `${offX + (lon - lonMin) * scale},${offY + (latMax - lat) * scale}`;
        const result: MapPath[] = geo.features.map(feat => {
          const ags = feat.properties.krs_code?.[0] ?? '';
          const rings: number[][][] = feat.geometry.type === 'Polygon'
            ? (feat.geometry.coordinates as number[][][])
            : (feat.geometry.coordinates as number[][][][]).flat();
          const path = rings.map(ring =>
            'M ' + ring.map(([lon, lat]) => proj(lon, lat)).join(' L ') + ' Z'
          ).join(' ');
          return { path, ags };
        });
        setPaths(result);
      })
      .catch(() => {});
  }, []);
  return paths;
}

// ── Shell ──────────────────────────────────────────────────────────────────────
function Shell({ children, accent = '#2563eb' }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{
      width: 540, height: 540, flexShrink: 0,
      background: 'linear-gradient(rgba(4,10,24,0.68), rgba(4,10,24,0.68)), url(/posters/de.png) center/cover no-repeat',
      borderRadius: 24, overflow: 'hidden', position: 'relative',
      fontFamily: "'Outfit', system-ui, sans-serif",
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
    }}>
      <div style={{ position: 'absolute', top: -120, left: -100, width: 440, height: 440, background: `radial-gradient(circle, ${accent}1e 0%, transparent 65%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, right: -60, width: 320, height: 320, background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(255,255,255,0.026) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '28px 34px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

// ── TopRow ─────────────────────────────────────────────────────────────────────
function TopRow({ badge, badgeColor = '#4ade80', accent = '#3b82f6' }: { badge: string; badgeColor?: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 900, color: '#fff', letterSpacing: '0.01em',
          boxShadow: `0 0 14px ${accent}38`,
        }}>{BRAND.badge}</div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.11em', textTransform: 'uppercase' }}>{BRAND.name}</span>
      </div>
      <div style={{
        fontSize: 9, fontWeight: 800, color: badgeColor,
        background: `${badgeColor}12`, border: `1px solid ${badgeColor}30`,
        borderRadius: 20, padding: '4px 11px', letterSpacing: '0.09em', textTransform: 'uppercase',
      }}>
        {badge}
      </div>
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer({ note }: { note?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.055)', marginTop: 'auto' }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontWeight: 700, letterSpacing: '0.02em' }}>{BRAND.domain}</span>
      {note && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.14)', fontWeight: 500 }}>{note}</span>}
      <div style={{ display: 'flex', gap: 5 }}>
        {['#60a5fa', '#a78bfa', '#34d399', '#facc15'].map((c, i) => (
          <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: c, opacity: 0.4 }} />
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export const HomeShareCard = forwardRef<HTMLDivElement, Props>(
  ({ variant = 'overview', employment, clusters, overlayData = [], overlayMeta }, ref) => {
    const mapPaths = useGermanyPaths();

    const valid = employment.filter(d => d.unemploymentRate != null);
    const avgAlq = valid.length ? valid.reduce((s, d) => s + d.unemploymentRate!, 0) / valid.length : null;
    const sorted = [...valid].sort((a, b) => a.unemploymentRate! - b.unemploymentRate!);
    const best5  = sorted.slice(0, 5);
    const worst5 = [...sorted].reverse().slice(0, 5);
    const totalUnemployed = employment.reduce((s, d) => s + (d.unemployed ?? 0), 0);
    const criticalCount = valid.filter(d => d.unemploymentRate! >= 10).length;
    const spread = sorted.length >= 2
      ? (sorted[sorted.length - 1].unemploymentRate! - sorted[0].unemploymentRate!).toFixed(1)
      : null;

    // Tier distribution for bar — ordered low→high (green left, red right)
    const tierCountsDisplay = [...ALQ_TIERS].reverse().map((t, i, arr) => {
      const upper = i < arr.length - 1 ? arr[i + 1].min : Infinity;
      const count = valid.filter(d => d.unemploymentRate! >= t.min && d.unemploymentRate! < upper).length;
      return { ...t, count, pct: valid.length > 0 ? (count / valid.length) * 100 : 0 };
    });

    const alqByAgs = Object.fromEntries(employment.map(e => [e.ags, e.unemploymentRate]));
    const clusterByAgs = Object.fromEntries((clusters ?? []).map(c => [c.ags, c]));

    // ── overview ───────────────────────────────────────────────────────
    if (variant === 'overview') {
      return (
        <Shell accent="#2563eb">
          <div ref={ref} style={{ position: 'absolute', inset: 0, padding: '28px 34px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <TopRow badge="Deutschland Live" badgeColor="#60a5fa" accent="#3b82f6" />

            {/* Hero */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.13em', textTransform: 'uppercase', marginBottom: 8 }}>
                Bundesdurchschnitt · Arbeitslosenquote
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ fontSize: 72, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {avgAlq != null ? n(avgAlq) : '—'}
                </div>
                <div style={{ paddingBottom: 6 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.45)', lineHeight: 1, letterSpacing: '-0.01em' }}>%</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 5, fontWeight: 600 }}>ALQ</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', marginTop: 6 }}>
                {employment.length} Landkreise · Bundesagentur für Arbeit
              </div>
            </div>

            {/* Distribution bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', marginBottom: 7, textTransform: 'uppercase' }}>
                Verteilung nach ALQ-Niveau
              </div>
              <div style={{ display: 'flex', height: 20, borderRadius: 7, overflow: 'hidden', gap: 1.5 }}>
                {tierCountsDisplay.map((t, i) =>
                  t.pct > 0 ? (
                    <div key={i} style={{
                      flex: t.pct,
                      background: t.fill,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.85)',
                      overflow: 'hidden',
                    }}>
                      {t.pct >= 12 ? `${Math.round(t.pct)}%` : ''}
                    </div>
                  ) : null
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {tierCountsDisplay.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 2, background: t.dot, opacity: 0.75 }} />
                    <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.28)', fontWeight: 600 }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { value: big(totalUnemployed), label: 'Arbeitslose gesamt', color: '#a78bfa' },
                { value: String(criticalCount), label: 'Kreise ALQ ≥ 10 %', color: '#f87171' },
                { value: spread ? `${spread} pp` : '—', label: 'Spanne Min–Max', color: '#facc15' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 19, fontWeight: 900, color: s.color, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 4, fontWeight: 600, lineHeight: 1.3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Best / worst */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.16)', borderRadius: 10, padding: '10px 13px' }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(74,222,128,0.6)', letterSpacing: '0.1em', marginBottom: 5, textTransform: 'uppercase' }}>Niedrigste ALQ</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{n(best5[0]?.unemploymentRate)} %</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{best5[0]?.districtName ?? '—'}</div>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.16)', borderRadius: 10, padding: '10px 13px' }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(239,68,68,0.6)', letterSpacing: '0.1em', marginBottom: 5, textTransform: 'uppercase' }}>Höchste ALQ</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#f87171', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{n(worst5[0]?.unemploymentRate)} %</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{worst5[0]?.districtName ?? '—'}</div>
              </div>
            </div>

            <Footer />
          </div>
        </Shell>
      );
    }

    // ── top10 ──────────────────────────────────────────────────────────
    if (variant === 'top10') {
      const maxAlq = worst5[0]?.unemploymentRate ?? 15;
      return (
        <Shell accent="#10b981">
          <div ref={ref} style={{ position: 'absolute', inset: 0, padding: '28px 34px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <TopRow badge="Ranking" badgeColor="#34d399" accent="#10b981" />
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.04em', lineHeight: 1 }}>Landkreise im Vergleich</h2>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 5 }}>
                {employment.length} Kreise · Arbeitslosenquote
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
              <div>
                <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(74,222,128,0.7)', letterSpacing: '0.12em', marginBottom: 12, textTransform: 'uppercase' }}>Niedrigste ALQ</div>
                {best5.map((d, i) => {
                  const pct = ((d.unemploymentRate ?? 0) / maxAlq) * 100;
                  return (
                    <div key={d.ags} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', width: 10, flexShrink: 0, fontWeight: 700 }}>{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.districtName}</div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#4ade80', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{n(d.unemploymentRate)} %</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginLeft: 17 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #4ade80, #22c55e)', borderRadius: 2, opacity: 0.75 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div>
                <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(239,68,68,0.7)', letterSpacing: '0.12em', marginBottom: 12, textTransform: 'uppercase' }}>Höchste ALQ</div>
                {worst5.map((d, i) => {
                  const pct = ((d.unemploymentRate ?? 0) / maxAlq) * 100;
                  return (
                    <div key={d.ags} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', width: 10, flexShrink: 0, fontWeight: 700 }}>{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.districtName}</div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#f87171', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{n(d.unemploymentRate)} %</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginLeft: 17 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #f87171, #ef4444)', borderRadius: 2, opacity: 0.75 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.12)', marginTop: 6 }}>Bundesagentur für Arbeit · {employment.length} Kreise erfasst</div>
            <Footer />
          </div>
        </Shell>
      );
    }

    // ── map_cluster ────────────────────────────────────────────────────
    if (variant === 'map_cluster') {
      const clusterColors: Record<number, string> = {};
      (clusters ?? []).forEach(c => { clusterColors[c.clusterId] = c.clusterColor; });
      const uniqueClusters = Array.from(new Set((clusters ?? []).map(c => c.clusterId)))
        .map(id => ({ id, label: (clusters ?? []).find(c => c.clusterId === id)?.clusterLabel ?? '', color: clusterColors[id] ?? '#666' }))
        .sort((a, b) => a.id - b.id);

      return (
        <Shell accent="#7c3aed">
          <div ref={ref} style={{ position: 'absolute', inset: 0, padding: '24px 28px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <TopRow badge="Kreistypen" badgeColor="#a78bfa" accent="#7c3aed" />
            <div style={{ marginBottom: 10 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.04em' }}>Kreistypen</h2>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', marginTop: 3 }}>ML K-Means · 18 sozioökon. Merkmale · 6 Cluster</div>
            </div>
            <div style={{ display: 'flex', flex: 1, gap: 14, alignItems: 'center' }}>
              {mapPaths.length > 0 ? (
                <svg viewBox="0 0 460 460" width={330} height={330} style={{ filter: 'drop-shadow(0 4px 22px rgba(0,0,0,0.75))', flexShrink: 0 }}>
                  {mapPaths.map(({ path, ags }) => {
                    const c = clusterByAgs[ags];
                    const fill = c ? `${c.clusterColor}92` : 'rgba(255,255,255,0.04)';
                    const stroke = c ? `${c.clusterColor}cc` : 'rgba(255,255,255,0.05)';
                    return <path key={ags} d={path} fill={fill} stroke={stroke} strokeWidth="0.6" strokeLinejoin="round" />;
                  })}
                </svg>
              ) : (
                <div style={{ width: 330, height: 330, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>Lade…</div>
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
                {uniqueClusters.slice(0, 6).map(cl => (
                  <div key={cl.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <div style={{ width: 11, height: 11, borderRadius: 3, background: cl.color, boxShadow: `0 0 9px ${cl.color}55`, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.72)', fontWeight: 600, lineHeight: 1.35 }}>{cl.label}</span>
                  </div>
                ))}
                <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.14)', marginTop: 6 }}>wöchentlich aktualisiert</div>
              </div>
            </div>
            <Footer />
          </div>
        </Shell>
      );
    }

    // ── map_overlay ────────────────────────────────────────────────────
    if (variant === 'map_overlay') {
      const meta = overlayMeta;
      const lookup = overlayData.length > 0 && meta
        ? buildOverlayLookup(overlayData, meta.higherIsBetter)
        : new Map<string, number>();

      return (
        <Shell accent="#06b6d4">
          <div ref={ref} style={{ position: 'absolute', inset: 0, padding: '24px 28px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <TopRow badge="Indikator Karte" badgeColor="#22d3ee" accent="#0891b2" />
            <div style={{ marginBottom: 10 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.04em' }}>
                {meta?.label ?? 'Indikator'}
              </h2>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', marginTop: 3 }}>
                Deutschland · {meta?.unit ?? ''} · {overlayData.length} Kreise
              </div>
            </div>
            <div style={{ display: 'flex', flex: 1, gap: 14, alignItems: 'center' }}>
              {mapPaths.length > 0 ? (
                <svg viewBox="0 0 460 460" width={365} height={365} style={{ filter: 'drop-shadow(0 4px 22px rgba(0,0,0,0.75))', flexShrink: 0 }}>
                  {mapPaths.map(({ path, ags }) => {
                    const q = lookup.get(ags) ?? null;
                    const stop = q != null ? OVERLAY_STOPS[q] : null;
                    return (
                      <path
                        key={ags}
                        d={path}
                        fill={stop?.fill ?? 'rgba(255,255,255,0.03)'}
                        stroke={stop?.stroke ?? 'rgba(255,255,255,0.05)'}
                        strokeWidth="0.4"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                </svg>
              ) : (
                <div style={{ width: 365, height: 365, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>Lade…</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.09em', marginBottom: 2, textTransform: 'uppercase' }}>
                  {meta?.higherIsBetter ? 'Hoch → Niedrig' : 'Niedrig → Hoch'}
                </div>
                {OVERLAY_STOPS.slice().reverse().map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 13, height: 13, borderRadius: 4, background: s.fill, border: `1px solid ${s.stroke}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.48)', fontWeight: 600 }}>{s.label}</span>
                  </div>
                ))}
                {overlayData.length > 0 && (() => {
                  const vals = overlayData.map(p => p.value);
                  const min = Math.min(...vals), max = Math.max(...vals);
                  const fmt = (v: number) => meta?.unit === '€' ? `€${Math.round(v / 1000)}k`
                    : meta?.unit === '%' ? `${v.toFixed(1)} %`
                    : v.toFixed(1);
                  return (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                      <div>Min: <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{fmt(min)}</span></div>
                      <div style={{ marginTop: 2 }}>Max: <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{fmt(max)}</span></div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <Footer />
          </div>
        </Shell>
      );
    }

    // ── map_alq ────────────────────────────────────────────────────────
    return (
      <Shell accent="#2563eb">
        <div ref={ref} style={{ position: 'absolute', inset: 0, padding: '24px 28px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
          <TopRow badge="Arbeitsmarkt Karte" badgeColor="#60a5fa" accent="#3b82f6" />
          <div style={{ marginBottom: 10 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.04em' }}>Arbeitslosenquote</h2>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', marginTop: 3 }}>Deutschland · {employment.length} Landkreise · Bundesagentur für Arbeit</div>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 14, alignItems: 'center' }}>
            {mapPaths.length > 0 ? (
              <svg viewBox="0 0 460 460" width={372} height={372} style={{ filter: 'drop-shadow(0 4px 22px rgba(0,0,0,0.75))', flexShrink: 0 }}>
                {mapPaths.map(({ path, ags }) => {
                  const alq = alqByAgs[ags] ?? null;
                  return (
                    <path
                      key={ags}
                      d={path}
                      fill={alqFill(alq)}
                      stroke={alqStroke(alq)}
                      strokeWidth="0.4"
                      strokeLinejoin="round"
                    />
                  );
                })}
              </svg>
            ) : (
              <div style={{ width: 372, height: 372, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>Lade Karte…</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {ALQ_TIERS.map(t => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: t.fill, border: `1px solid ${t.dot}44`, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: t.dot, fontVariantNumeric: 'tabular-nums' }}>{t.label}</div>
                    <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>ALQ</div>
                  </div>
                </div>
              ))}
              {avgAlq != null && (
                <div style={{ marginTop: 4, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#60a5fa', letterSpacing: '-0.02em' }}>Ø {n(avgAlq)} %</div>
                  <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.2)', fontWeight: 600, marginTop: 2 }}>Bundesdurchschnitt</div>
                </div>
              )}
            </div>
          </div>
          <Footer />
        </div>
      </Shell>
    );
  }
);

HomeShareCard.displayName = 'HomeShareCard';
