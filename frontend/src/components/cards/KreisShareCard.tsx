import { forwardRef, useEffect, useState } from 'react';
import type { EmploymentDTO } from '../../types/employment';
import type { ClusterDTO } from '../../types/cluster';
import type { GdpDTO } from '../../types/gdp';
import type { SocialDTO } from '../../types/social';
import type { DemographicsDTO } from '../../types/demographics';
import type { BroadbandDTO } from '../../types/broadband';
import type { HousingDTO } from '../../types/housing';
import type { HealthcareDTO } from '../../types/healthcare';
import type { NatPopDTO } from '../../types/natpop';
import type { EmploymentExtendedDTO } from '../../types/employmentextended';
import type { CommutersDTO } from '../../types/commuters';
import type { VehiclesDTO } from '../../types/vehicles';
import type { TransitDTO } from '../../types/transit';
import { BRAND } from '../../lib/brand';

export type CardVariant = 'overview' | 'economy' | 'social' | 'cluster' | 'map' | 'population' | 'labor' | 'mobility';

interface Props {
  variant?: CardVariant;
  employment: EmploymentDTO | null;
  cluster: ClusterDTO | null;
  gdp: GdpDTO | null;
  social: SocialDTO | null;
  demographics: DemographicsDTO | null;
  broadband?: BroadbandDTO | null;
  housing?: HousingDTO | null;
  healthcare?: HealthcareDTO | null;
  natpop?: NatPopDTO | null;
  employmentExtended?: EmploymentExtendedDTO | null;
  commuters?: CommutersDTO | null;
  vehicles?: VehiclesDTO | null;
  transit?: TransitDTO | null;
  bundesland: string;
}

function n(v: number | null | undefined, decimals = 1) {
  if (v == null) return '—';
  return Number(v).toFixed(decimals);
}
function big(v: number | null | undefined): string {
  if (v == null) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

function StatBlock({ value, label, color = '#fff' }: { value: string; label: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontWeight: 500, lineHeight: 1.3 }}>
        {label}
      </div>
    </div>
  );
}

function CardShell({ children, accentColor = '#2563eb', ags }: { children: React.ReactNode; accentColor?: string; ags?: string }) {
  const bg = ags
    ? `linear-gradient(rgba(4,8,22,0.72), rgba(4,8,22,0.72)), url(/posters/${ags}.png) center/cover no-repeat`
    : 'linear-gradient(145deg, #060d1f 0%, #0d1b40 45%, #071124 100%)';
  return (
    <div style={{
      width: 540, height: 540,
      background: bg,
      borderRadius: 24, overflow: 'hidden', position: 'relative',
      fontFamily: "'Outfit', system-ui, sans-serif", flexShrink: 0,
    }}>
      {/* Glow */}
      <div style={{ position: 'absolute', top: -80, left: -60, width: 320, height: 320, background: `radial-gradient(circle, ${accentColor}28 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, right: -40, width: 260, height: 260, background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
      {/* Dot grid */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, padding: '36px 40px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

function CardHeader({ name, bundesland, ags, badge, badgeColor }: { name: string; bundesland: string; ags?: string; badge?: string; badgeColor?: string }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🇩🇪</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{BRAND.name}</span>
        </div>
        {badge && (
          <div style={{ fontSize: 10, fontWeight: 700, color: badgeColor ?? '#4ade80', background: `${badgeColor ?? '#4ade80'}1a`, border: `1px solid ${badgeColor ?? '#4ade80'}40`, borderRadius: 20, padding: '3px 10px', letterSpacing: '0.08em' }}>
            {badge}
          </div>
        )}
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>{bundesland}</div>
        <h1 style={{ fontSize: name.length > 20 ? 34 : 42, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.04em', lineHeight: 1.05 }}>{name}</h1>
        {ags && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>AGS {ags}</div>}
      </div>
    </>
  );
}

function CardFooter() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 'auto' }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', fontWeight: 500 }}>{BRAND.domain}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {['#60a5fa','#a78bfa','#34d399','#facc15'].map((c, i) => (
          <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: c, opacity: 0.5 }} />
        ))}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%)', margin: '20px 0' }} />;
}

type GeoFeature = { properties: { krs_code: string[] }; geometry: { type: string; coordinates: number[][][][] | number[][][] } };

function useKreisShape(ags: string | undefined) {
  const [paths, setPaths] = useState<string[]>([]);
  useEffect(() => {
    if (!ags) return;
    Promise.all([
      fetch('/kreise-bbox.json').then(r => r.json()),
      fetch('/kreise.geo.json').then(r => r.json()),
    ]).then(([bbox, geo]: [Record<string, number[]>, { features: GeoFeature[] }]) => {
      const bb = bbox[ags];
      if (!bb) return;
      const [latMin, lonMin, latMax, lonMax] = bb;
      const W = 340, H = 340;
      const pad = 30;
      const scaleX = (W - pad * 2) / (lonMax - lonMin);
      const scaleY = (H - pad * 2) / (latMax - latMin);
      const scale = Math.min(scaleX, scaleY);
      const offsetX = pad + ((W - pad * 2) - (lonMax - lonMin) * scale) / 2;
      const offsetY = pad + ((H - pad * 2) - (latMax - latMin) * scale) / 2;

      const project = (lon: number, lat: number) =>
        `${offsetX + (lon - lonMin) * scale},${offsetY + (latMax - lat) * scale}`;

      const feat = geo.features.find((f: GeoFeature) => f.properties.krs_code?.[0] === ags);
      if (!feat) return;

      const rings: number[][][] = feat.geometry.type === 'Polygon'
        ? (feat.geometry.coordinates as number[][][])
        : (feat.geometry.coordinates as number[][][][]).flat();

      setPaths(rings.map(ring =>
        'M ' + ring.map(([lon, lat]) => project(lon, lat)).join(' L ') + ' Z'
      ));
    }).catch(() => {});
  }, [ags]);
  return paths;
}

export const KreisShareCard = forwardRef<HTMLDivElement, Props>(
  ({ variant = 'overview', employment, cluster, gdp, social, demographics, broadband, housing, healthcare, natpop, employmentExtended, commuters, vehicles, transit, bundesland }, ref) => {
    const name = employment?.districtName ?? '—';
    const alq = employment?.unemploymentRate;
    const alqColor = alq == null ? '#94a3b8' : alq >= 10 ? '#ef4444' : alq >= 7 ? '#f97316' : alq >= 4 ? '#facc15' : '#4ade80';
    const mapPaths = useKreisShape(variant === 'map' ? employment?.ags : undefined);

    if (variant === 'economy') {
      return (
        <CardShell accentColor="#f59e0b" ags={employment?.ags}>
          <div ref={ref} style={{ position: 'absolute', inset: 0, padding: '36px 40px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <CardHeader name={name} bundesland={bundesland} ags={employment?.ags} badge="WIRTSCHAFT" badgeColor="#fbbf24" />
            <Divider />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              <StatBlock value={gdp?.gdpPerCapita != null ? `€${Math.round(gdp.gdpPerCapita / 1000)}k` : '—'} label="BIP pro Kopf" color="#fbbf24" />
              <StatBlock value={gdp?.gdpTotalMillions != null ? `€${(gdp.gdpTotalMillions / 1000).toFixed(1)} Mrd` : '—'} label="BIP gesamt" color="#f97316" />
              <StatBlock value={social?.incomeMonthlyEur != null ? `€${Math.round(social.incomeMonthlyEur / 100) * 100}` : '—'} label="Nettoeinkommen/Mo" color="#fb923c" />
              <StatBlock value={alq != null ? `${n(alq)} %` : '—'} label="Arbeitslosigkeit" color={alqColor} />
            </div>
            <Divider />
            <CardFooter />
          </div>
        </CardShell>
      );
    }

    if (variant === 'social') {
      return (
        <CardShell accentColor="#a855f7" ags={employment?.ags}>
          <div ref={ref} style={{ position: 'absolute', inset: 0, padding: '36px 40px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <CardHeader name={name} bundesland={bundesland} ags={employment?.ags} badge="SOZIALES" badgeColor="#c084fc" />
            <Divider />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              <StatBlock value={social?.childPovertyPct != null ? `${n(social.childPovertyPct)} %` : '—'} label="Kinderarmut" color="#f472b6" />
              <StatBlock value={broadband?.cov100Mbit != null ? `${n(broadband.cov100Mbit)} %` : '—'} label="Breitband ≥100 Mbit" color="#60a5fa" />
              <StatBlock value={housing?.rentPerSqm != null ? `€${n(housing.rentPerSqm, 2)}/m²` : '—'} label="Angebotsmiete" color="#fb923c" />
              <StatBlock value={healthcare?.doctorsPer100k != null ? `${n(healthcare.doctorsPer100k)}` : '—'} label="Ärzte / 100k" color="#34d399" />
            </div>
            <Divider />
            <CardFooter />
          </div>
        </CardShell>
      );
    }

    if (variant === 'cluster') {
      return (
        <CardShell accentColor={cluster?.clusterColor ?? '#7c3aed'} ags={employment?.ags}>
          <div ref={ref} style={{ position: 'absolute', inset: 0, padding: '36px 40px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <CardHeader name={name} bundesland={bundesland} ags={employment?.ags} badge="KREISTYP" badgeColor={cluster?.clusterColor} />
            {cluster ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: `${cluster.clusterColor}22`, border: `2px solid ${cluster.clusterColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: cluster.clusterColor, boxShadow: `0 0 12px ${cluster.clusterColor}80` }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{cluster.clusterLabel}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>Cluster {(cluster.clusterId ?? 0) + 1} von 6 · ML K-Means</div>
                  </div>
                </div>
                <Divider />
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Ähnlichste Kreise</div>
                {(cluster.similarKreise ?? []).slice(0, 4).map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.cluster_color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, flex: 1 }}>{s.district_name}</span>
                    <div style={{ width: 80, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round(s.similarity * 100)}%`, background: cluster.clusterColor, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums', width: 30, textAlign: 'right' }}>{Math.round(s.similarity * 100)}%</span>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Clustering-Daten nicht verfügbar</div>
            )}
            <CardFooter />
          </div>
        </CardShell>
      );
    }

    if (variant === 'map') {
      const area = demographics?.areaKm2;
      const pop = demographics?.population;
      const density = demographics?.populationDensity ?? (pop != null && area != null ? pop / area : null);
      return (
        <CardShell accentColor="#06b6d4" ags={employment?.ags}>
          <div ref={ref} style={{ position: 'absolute', inset: 0, padding: '36px 40px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <CardHeader name={name} bundesland={bundesland} ags={employment?.ags} badge="KARTE" badgeColor="#22d3ee" />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {/* Glow behind map */}
              <div style={{ position: 'absolute', width: 260, height: 260, background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
              {mapPaths.length > 0 ? (
                <svg viewBox="0 0 340 340" width={280} height={280} style={{ filter: 'drop-shadow(0 0 16px rgba(6,182,212,0.35))' }}>
                  <defs>
                    <linearGradient id="mapFill" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                  {mapPaths.map((d, i) => (
                    <path key={i} d={d} fill="url(#mapFill)" stroke="rgba(14,165,233,0.6)" strokeWidth="1.5" />
                  ))}
                </svg>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>Lade Karte…</div>
              )}
              {/* Stat pills overlaid */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 8, justifyContent: 'center' }}>
                {[
                  { label: 'Einwohner', value: big(pop) },
                  { label: 'Fläche', value: area != null ? `${Math.round(area)} km²` : '—' },
                  { label: 'Dichte', value: density != null ? `${Math.round(density)}/km²` : '—' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 8, padding: '5px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#22d3ee', letterSpacing: '-0.02em' }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <CardFooter />
          </div>
        </CardShell>
      );
    }

    if (variant === 'population') {
      const netChange = natpop?.naturalChange;
      const changeColor = netChange == null ? '#94a3b8' : netChange > 0 ? '#4ade80' : netChange < 0 ? '#f87171' : '#94a3b8';
      return (
        <CardShell accentColor="#10b981" ags={employment?.ags}>
          <div ref={ref} style={{ position: 'absolute', inset: 0, padding: '36px 40px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <CardHeader name={name} bundesland={bundesland} ags={employment?.ags} badge="BEVÖLKERUNG" badgeColor="#34d399" />
            <Divider />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              <StatBlock value={big(demographics?.population)} label="Einwohner" color="#34d399" />
              <StatBlock value={demographics?.populationDensity != null ? `${Math.round(demographics.populationDensity)}/km²` : '—'} label="Bevölkerungsdichte" color="#6ee7b7" />
              <StatBlock value={natpop?.birthRate != null ? `${n(natpop.birthRate, 1)}‰` : '—'} label="Geburtenrate" color="#4ade80" />
              <StatBlock value={natpop?.deathRate != null ? `${n(natpop.deathRate, 1)}‰` : '—'} label="Sterberate" color="#f87171" />
            </div>
            <Divider />
            {netChange != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: changeColor }}>{netChange > 0 ? '+' : ''}{netChange}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>natürl. Bevölkerungsveränderung</div>
              </div>
            )}
            <CardFooter />
          </div>
        </CardShell>
      );
    }

    if (variant === 'labor') {
      return (
        <CardShell accentColor="#f59e0b" ags={employment?.ags}>
          <div ref={ref} style={{ position: 'absolute', inset: 0, padding: '36px 40px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <CardHeader name={name} bundesland={bundesland} ags={employment?.ags} badge="ARBEITSMARKT" badgeColor="#fbbf24" />
            <Divider />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              <StatBlock value={alq != null ? `${n(alq)} %` : '—'} label="Arbeitslosenquote" color={alqColor} />
              <StatBlock value={employmentExtended?.alqLongTerm != null ? `${n(employmentExtended.alqLongTerm)} %` : '—'} label="Langzeitarbeitslos" color="#fb923c" />
              <StatBlock value={employmentExtended?.alqYouth != null ? `${n(employmentExtended.alqYouth)} %` : '—'} label="Jugendarbeitslosigkeit" color="#fbbf24" />
              <StatBlock value={employmentExtended?.sgb2Rate != null ? `${n(employmentExtended.sgb2Rate)} %` : '—'} label="SGB-II-Quote" color="#f472b6" />
            </div>
            <Divider />
            {commuters?.commuterBalance != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: commuters.commuterBalance > 0 ? '#4ade80' : '#f87171' }}>
                  {commuters.commuterBalance > 0 ? '+' : ''}{big(commuters.commuterBalance)}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Pendlersaldo · {big(commuters.commutersIn)} ein / {big(commuters.commutersOut)} aus</div>
              </div>
            )}
            <CardFooter />
          </div>
        </CardShell>
      );
    }

    if (variant === 'mobility') {
      const evShare = vehicles?.electricShare;
      const evColor = evShare == null ? '#94a3b8' : evShare >= 5 ? '#4ade80' : evShare >= 2 ? '#facc15' : '#f87171';
      return (
        <CardShell accentColor="#8b5cf6" ags={employment?.ags}>
          <div ref={ref} style={{ position: 'absolute', inset: 0, padding: '36px 40px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <CardHeader name={name} bundesland={bundesland} ags={employment?.ags} badge="MOBILITÄT" badgeColor="#a78bfa" />
            <Divider />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              <StatBlock value={vehicles?.carsPer1000 != null ? `${Math.round(vehicles.carsPer1000)}` : '—'} label="PKW / 1.000 EW" color="#a78bfa" />
              <StatBlock value={evShare != null ? `${n(evShare, 1)} %` : '—'} label="E-Auto-Anteil" color={evColor} />
              <StatBlock value={transit?.stationCount != null ? `${transit.stationCount}` : '—'} label="Bahnhöfe" color="#60a5fa" />
              <StatBlock value={commuters?.commuterRatio != null ? `${n(commuters.commuterRatio, 1)} %` : '—'} label="Auspendlerquote" color="#f472b6" />
            </div>
            <Divider />
            {transit?.hasLongDistance && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade8080' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Fernverkehrsanbindung vorhanden</span>
              </div>
            )}
            <CardFooter />
          </div>
        </CardShell>
      );
    }

    // overview (default)
    const stats = [
      { label: 'Arbeitslosigkeit', value: alq != null ? `${n(alq)} %` : '—', color: alqColor },
      { label: 'BIP pro Kopf',    value: gdp?.gdpPerCapita != null ? `€${Math.round(gdp.gdpPerCapita / 1000)}k` : '—', color: '#60a5fa' },
      { label: 'Einkommen/Mo',    value: social?.incomeMonthlyEur != null ? `€${Math.round(social.incomeMonthlyEur / 100) * 100}` : '—', color: '#a78bfa' },
      { label: 'Einwohner',       value: big(demographics?.population), color: '#34d399' },
    ];

    return (
      <CardShell ags={employment?.ags}>
        <div ref={ref} style={{ position: 'absolute', inset: 0, padding: '36px 40px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
          <CardHeader name={name} bundesland={bundesland} ags={employment?.ags} badge="LIVE DATA" />
          <Divider />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 4 }}>
            {stats.map(s => <StatBlock key={s.label} {...s} />)}
          </div>
          <Divider />
          {cluster && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: cluster.clusterColor, boxShadow: `0 0 8px ${cluster.clusterColor}80` }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: cluster.clusterColor }}>{cluster.clusterLabel}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>· Cluster {(cluster.clusterId ?? 0) + 1} von 6</span>
            </div>
          )}
          <CardFooter />
        </div>
      </CardShell>
    );
  }
);

KreisShareCard.displayName = 'KreisShareCard';
