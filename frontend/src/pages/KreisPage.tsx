import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { kreisPath, kreisAgsFromSlugs } from '../lib/kreis-slugs';
import { EnergyPanel } from '../components/panels/EnergyPanel';
import { WeatherCard } from '../components/panels/WeatherCard';
import { AirQualityCard } from '../components/panels/AirQualityCard';
import { SkeletonCard, SkeletonText } from '../components/common/SkeletonCard';
import { getBundesland, BL_META, codeToSlug } from '../lib/bundeslaender';
import { useEmployment } from '../hooks/useEmployment';
import { useDemographics } from '../hooks/useDemographics';
import { useRenewables } from '../hooks/useRenewables';
import { useElection } from '../hooks/useElection';
import { useVehicles } from '../hooks/useVehicles';
import { useJobListings, DEFAULT_FILTERS, type JobFilters } from '../hooks/useJobListings';
import { useVacancies } from '../hooks/useVacancies';
import { useEmploymentExtended } from '../hooks/useEmploymentExtended';
import { useNatPop } from '../hooks/useNatPop';
import { useGdp } from '../hooks/useGdp';
import { useBroadband } from '../hooks/useBroadband';
import { useCommuters } from '../hooks/useCommuters';
import { useHousing } from '../hooks/useHousing';
import { useHealthcare } from '../hooks/useHealthcare';
import { useTransit } from '../hooks/useTransit';
import { useSocial } from '../hooks/useSocial';
import { useEducation } from '../hooks/useEducation';
import { useAccessibility } from '../hooks/useAccessibility';
import { useEv } from '../hooks/useEv';
import { usePopulationDynamics } from '../hooks/usePopulationDynamics';
import { useFuel } from '../hooks/useFuel';
import { useCluster } from '../hooks/useCluster';
import { useNews } from '../hooks/useNews';
import { AnimatedNumber } from '../components/common/AnimatedNumber';
import { SimilarByMetric } from '../components/panels/SimilarByMetric';
import { KreisMap } from '../components/maps/KreisMap';
import { useThemeColors } from '../lib/theme-colors';
import L from 'leaflet';
import type { EmploymentDTO } from '../types/employment';

const COND_ICONS: Record<string, string> = {
  dry: '☀️', fog: '🌫️', rain: '🌧️', sleet: '🌨️',
  snow: '❄️', hail: '🌩️', thunderstorm: '⛈️',
};
const COND_LABELS: Record<string, string> = {
  dry: 'Trocken', fog: 'Nebel', rain: 'Regen', sleet: 'Graupel',
  snow: 'Schnee', hail: 'Hagel', thunderstorm: 'Gewitter',
};
const AMENITY_LABELS: Record<string, string> = {
  school: 'Schule', university: 'Universität', college: 'Berufsschule', kindergarten: 'Kindergarten',
  hospital: 'Krankenhaus', clinic: 'Klinik', pharmacy: 'Apotheke', doctors: 'Arztpraxis',
  town_hall: 'Rathaus', courthouse: 'Gericht', police: 'Polizei', fire_station: 'Feuerwehr',
  library: 'Bibliothek', post_office: 'Post',
  sports_centre: 'Sportzentrum', social_facility: 'Sozialeinrichtung', community_centre: 'Gemeindezentrum',
};
const AMENITY_COLORS: Record<string, string> = {
  school: '#2563EB', university: '#7C3AED', college: '#9333EA', kindergarten: '#0891B2',
  hospital: '#DC2626', clinic: '#EF4444', pharmacy: '#059669', doctors: '#10B981',
  town_hall: '#0f172a', courthouse: '#1e40af', police: '#1d4ed8', fire_station: '#b91c1c',
  library: '#7c3aed', post_office: '#d97706',
  sports_centre: '#16a34a', social_facility: '#0891b2', community_centre: '#059669',
};

function alqColor(alq: number) {
  if (alq >= 10) return '#dc2626';
  if (alq >= 7)  return '#d97706';
  if (alq >= 4)  return '#2563eb';
  return '#16a34a';
}
function alqLabel(alq: number) {
  if (alq >= 10) return 'Hoch';
  if (alq >= 7)  return 'Erhöht';
  if (alq >= 4)  return 'Moderat';
  return 'Gering';
}
function alqBg(alq: number) {
  if (alq >= 10) return '#fef2f2';
  if (alq >= 7)  return '#fffbeb';
  if (alq >= 4)  return '#eff6ff';
  return '#f0fdf4';
}

function useBreakpoint() {
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { isMobile: width < 640, isTablet: width < 900 };
}

/* ── Shared card header ─────────────────────────────────────────── */
function CardHeader({ title, badge, badgeStyle }: {
  title: string;
  badge?: string;
  badgeStyle?: 'success' | 'neutral' | 'warning';
}) {
  const C = useThemeColors();
  const badgeClass = badgeStyle === 'success' ? 'badge badge-success badge-soft badge-sm'
    : badgeStyle === 'warning' ? 'badge badge-warning badge-soft badge-sm'
    : 'badge badge-ghost badge-sm';
  return (
    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{title}</span>
      {badge && <span className={badgeClass}>{badge}</span>}
    </div>
  );
}

/* ── Section header ─────────────────────────────────────────────── */
function SectionHeader({ title, source, note }: { title: string; source?: string; note?: string }) {
  return (
    <div className="section-header">
      <div className="section-header-row">
        <h2>{title}</h2>
        {source && <span className="section-header-source">{source}</span>}
      </div>
      {note && <p className="section-header-note">{note}</p>}
    </div>
  );
}

/* ── Infrastructure panel — single map with category tabs ────────── */
interface InfraLoc {
  id: number; lat: number; lon: number;
  name: string; type: string;
  address?: string;
  openingHours?: string;
  wheelchair?: string;
  operator?: string;
  phone?: string;
  website?: string;
}

const INFRA_CATS = [
  { key: 'education' as const, label: '🏫 Bildung',    amenities: ['school','university','college','kindergarten'] },
  { key: 'health'    as const, label: '🏥 Gesundheit', amenities: ['hospital','clinic','pharmacy','doctors'] },
  { key: 'public'    as const, label: '🏛️ Behörden',  amenities: ['town_hall','courthouse','police','fire_station','library','post_office'] },
  { key: 'sports'    as const, label: '🏋️ Freizeit',  amenities: ['sports_centre','social_facility','community_centre'] },
];
type InfraCatKey = typeof INFRA_CATS[number]['key'];

function InfraMap({ locations, bbox, height, categoryKey }: {
  locations: InfraLoc[];
  bbox: [number, number, number, number];
  height: number;
  categoryKey: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markersRef   = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;
    if ((el as any)._leaflet_id) delete (el as any)._leaflet_id;
    const map = L.map(el, { zoomControl: true, scrollWheelZoom: false, attributionControl: false });
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    const [s, w, n, e] = bbox;
    map.fitBounds([[s, w], [n, e]], { padding: [10, 10] });
    return () => { map.remove(); mapRef.current = null; delete (el as any)._leaflet_id; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    locations.forEach(loc => {
      const m = L.circleMarker([loc.lat, loc.lon], {
        radius: 5, fillColor: AMENITY_COLORS[loc.type] ?? '#6b7280',
        color: '#fff', weight: 1.5, fillOpacity: 0.85,
      });
      if (loc.name || loc.address) m.bindTooltip(
        `<div style="font-family:inherit;max-width:200px">
          <strong style="font-size:12px">${loc.name || '(kein Name)'}</strong>
          <span style="color:#6B6B6B;font-size:10px;margin-left:5px">${AMENITY_LABELS[loc.type] ?? loc.type}</span>
          ${loc.address ? `<br/><span style="font-size:10px;color:#475569">📍 ${loc.address}</span>` : ''}
          ${loc.openingHours ? `<br/><span style="font-size:10px;color:#059669">🕐 ${loc.openingHours.length > 35 ? loc.openingHours.slice(0, 35) + '…' : loc.openingHours}</span>` : ''}
          ${loc.wheelchair === 'yes' ? '<br/><span style="font-size:10px;color:#16a34a">♿ Barrierefrei</span>' : ''}
        </div>`,
        { className: 'leaflet-tooltip-custom' }
      );
      m.addTo(map);
      markersRef.current.push(m);
    });
  }, [categoryKey, locations]);

  return <div ref={containerRef} style={{ height, zIndex: 0 }} />;
}

function InfrastructurePanel({ ags, population }: { ags: string | undefined; population?: number }) {
  const C = useThemeColors();
  const { isMobile } = useBreakpoint();
  const [activeKey, setActiveKey] = useState<InfraCatKey>('education');
  const [locCache,  setLocCache]  = useState<Partial<Record<InfraCatKey, InfraLoc[]>> | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null);

  useEffect(() => {
    if (!ags) return;
    setBbox(null);
    setLocCache(null);
    fetch('/kreise-bbox.json')
      .then(r => r.json())
      .then((d: Record<string, [number,number,number,number]>) => { setBbox(d[ags] ?? null); })
      .catch(() => {});
  }, [ags]);

  useEffect(() => {
    if (!bbox) return;
    setLoading(true);
    const [s, w, n, e] = bbox;
    const allAmenities = INFRA_CATS.flatMap(c => c.amenities).join('|');
    const query = `[out:json][timeout:40];(node[amenity~"^(${allAmenities})$"](${s},${w},${n},${e});way[amenity~"^(${allAmenities})$"](${s},${w},${n},${e}););out center 300;`;
    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
      .then(r => r.json())
      .then((d: any) => {
        const all: InfraLoc[] = (d.elements as any[]).flatMap((el: any) => {
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          if (lat == null || lon == null) return [];
          const t = el.tags ?? {};
          const street = t['addr:street'];
          const num    = t['addr:housenumber'];
          const city   = t['addr:city'];
          const addrParts = [street && num ? `${street} ${num}` : street, city].filter(Boolean);
          return [{
            id: el.id, lat, lon,
            name:         t.name ?? t['name:de'] ?? '',
            type:         t.amenity ?? '',
            address:      addrParts.length ? addrParts.join(', ') : undefined,
            openingHours: t.opening_hours,
            wheelchair:   t.wheelchair,
            operator:     t.operator ?? t['operator:de'],
            phone:        t.phone ?? t['contact:phone'],
            website:      t.website ?? t['contact:website'],
          }];
        });
        const cache: Partial<Record<InfraCatKey, InfraLoc[]>> = {};
        for (const cat of INFRA_CATS) {
          cache[cat.key] = all.filter(l => cat.amenities.includes(l.type));
        }
        setLocCache(cache);
      })
      .catch(() => {
        const empty: Partial<Record<InfraCatKey, InfraLoc[]>> = {};
        for (const cat of INFRA_CATS) { empty[cat.key] = []; }
        setLocCache(empty);
      })
      .finally(() => setLoading(false));
  }, [bbox]);

  const activeLocs = locCache?.[activeKey];
  const named   = activeLocs?.filter(l => l.name) ?? [];

  const cat          = INFRA_CATS.find(c => c.key === activeKey)!;
  const typeCounts   = cat.amenities
    .map(t => ({ type: t, count: activeLocs?.filter(l => l.type === t).length ?? 0 }))
    .filter(x => x.count > 0);
  const maxCount     = Math.max(...typeCounts.map(x => x.count), 1);
  const accessible   = activeLocs?.filter(l => l.wheelchair === 'yes').length ?? 0;
  const withHours    = activeLocs?.filter(l => l.openingHours).length ?? 0;
  const perCapita    = population && activeLocs?.length ? Math.round(population / activeLocs.length) : null;
  const withData     = named.filter(l => l.address || l.openingHours || l.operator || l.phone || l.website);

  return (
    <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
      {/* ── Category selector ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid #f1f5f9' }}>
        {INFRA_CATS.map(c => {
          const count  = locCache ? (locCache[c.key]?.length ?? 0) : null;
          const active = c.key === activeKey;
          return (
            <button key={c.key} onClick={() => setActiveKey(c.key)} style={{
              padding: '10px 6px', border: 'none', background: active ? '#eff6ff' : 'none',
              cursor: 'pointer', fontFamily: 'inherit',
              borderBottom: `2px solid ${active ? '#2563eb' : 'transparent'}`,
              borderRight: '1px solid #f1f5f9', transition: 'background 0.12s',
            }}>
              <div style={{ fontSize: 10, color: active ? '#2563eb' : '#64748b', fontWeight: active ? 700 : 500 }}>{c.label}</div>
              <div style={{ marginTop: 2, fontSize: 18, fontWeight: 800, color: active ? '#2563eb' : '#0f172a', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                {loading ? '…' : (count ?? '—')}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Map + stats side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 180px', minHeight: 260 }}>
        <div style={{ borderRight: '1px solid #f1f5f9' }}>
          {bbox ? (
            <InfraMap key={ags} locations={activeLocs ?? []} bbox={bbox} height={260} categoryKey={activeKey} />
          ) : (
            <div style={{ height: 260, background: C.bgCard2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Lade…</span>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          {loading ? (
            <SkeletonCard height={160} />
          ) : activeLocs && activeLocs.length > 0 ? (
            <>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Aufschlüsselung</div>
                {typeCounts.map(({ type, count }) => (
                  <div key={type} style={{ marginBottom: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 10, color: C.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{AMENITY_LABELS[type] ?? type}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: C.text1, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                    </div>
                    <div style={{ background: C.bgGrid, borderRadius: 999, height: 4 }}>
                      <div style={{ width: `${(count / maxCount) * 100}%`, height: '100%', borderRadius: 999, background: AMENITY_COLORS[type] ?? '#6b7280', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {perCapita && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>Versorgung</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text1 }}>1 je {perCapita.toLocaleString('de-DE')} Einw.</span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>Barrierefrei</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: accessible > 0 ? '#16a34a' : '#94a3b8' }}>
                    {accessible > 0 ? `${accessible} (${Math.round(accessible / activeLocs.length * 100)} %)` : 'nicht erfasst'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>Öffnungszeiten</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: withHours > 0 ? '#2563eb' : '#94a3b8' }}>
                    {withHours > 0 ? `${withHours} erfasst` : 'nicht erfasst'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Keine Daten</span>
          )}
        </div>
      </div>

      {/* ── Location list ── */}
      {!loading && withData.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          <div style={{ padding: '7px 16px', background: C.bgCard2, borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {withData.length} Einrichtungen mit Details
            </span>
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {withData.slice(0, 30).map(loc => (
              <div key={loc.id} style={{ padding: '7px 16px', borderBottom: '1px solid #f8fafc', display: 'grid', gridTemplateColumns: '1fr auto', gap: '2px 8px', alignItems: 'start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: AMENITY_COLORS[loc.type] ?? '#6b7280', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc.name}</span>
                  </div>
                  <div style={{ paddingLeft: 13, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {loc.address   && <span style={{ fontSize: 10, color: C.text3 }}>📍 {loc.address}</span>}
                    {loc.operator  && <span style={{ fontSize: 10, color: C.text3 }}>🏢 {loc.operator}</span>}
                    {loc.openingHours && <span style={{ fontSize: 10, color: '#059669' }}>🕐 {loc.openingHours.length > 45 ? loc.openingHours.slice(0, 45) + '…' : loc.openingHours}</span>}
                    {loc.phone     && <span style={{ fontSize: 10, color: C.text3 }}>📞 {loc.phone}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                  <span style={{ fontSize: 9, color: '#94a3b8', background: C.bgGrid, borderRadius: 3, padding: '1px 5px', whiteSpace: 'nowrap' }}>
                    {AMENITY_LABELS[loc.type] ?? loc.type}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {loc.wheelchair === 'yes' && <span title="Barrierefrei" style={{ fontSize: 11 }}>♿</span>}
                    {loc.website && (
                      <a href={loc.website.startsWith('http') ? loc.website : `https://${loc.website}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, textDecoration: 'none' }} title="Website">🌐</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {(activeLocs?.length ?? 0) - withData.length > 0 && (
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 16px 8px' }}>
                + {(activeLocs?.length ?? 0) - withData.length} weitere ohne erfasste Details
              </p>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: '6px 16px', borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>
          Quelle: OpenStreetMap · <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8' }}>© OpenStreetMap contributors</a>
        </p>
      </div>
    </div>
  );
}

/* ── Comparison card ────────────────────────────────────────────── */
interface Comparison {
  rank: number; total: number;
  nationalAvg: number;
  blAvg: number; blRank: number; blTotal: number;
}

function ComparisonCard({ alq, cmp, bundesland }: { alq: number; cmp: Comparison; bundesland: string }) {
  const C = useThemeColors();
  const diff   = alq - cmp.nationalAvg;
  const blDiff = alq - cmp.blAvg;
  const rankPct = ((cmp.rank - 1) / (cmp.total - 1)) * 100;
  const color = alqColor(alq);

  return (
    <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
      <CardHeader title="📊 Einordnung & Vergleich" />
      <div style={{ padding: '16px' }}>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.text3 }}>Bundesweiter Rang (Rang 1 = niedrigste ALQ)</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>
              Platz {cmp.rank.toLocaleString('de-DE')} / {cmp.total.toLocaleString('de-DE')}
            </span>
          </div>
          <div style={{ background: C.bgGrid, borderRadius: 999, height: 7, position: 'relative' }}>
            <div style={{ width: `${rankPct}%`, height: '100%', borderRadius: 999, background: color, transition: 'width 0.6s ease' }} />
            <div style={{ position: 'absolute', top: '50%', left: `${rankPct}%`, transform: 'translate(-50%, -50%)', width: 13, height: 13, borderRadius: '50%', background: color, border: '2px solid #fff', boxShadow: '0 0 0 2px ' + color }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>Besser</span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>Schlechter</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text1 }}>vs. Bundesschnitt</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Ø {cmp.nationalAvg.toFixed(1)} %</div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: diff <= 0 ? '#16a34a' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
            {diff > 0 ? '+' : ''}{diff.toFixed(1)} PP
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text1 }}>vs. {bundesland}-Schnitt</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
              Ø {cmp.blAvg.toFixed(1)} % · Platz {cmp.blRank} / {cmp.blTotal} im Land
            </div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: blDiff <= 0 ? '#16a34a' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
            {blDiff > 0 ? '+' : ''}{blDiff.toFixed(1)} PP
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Bundesland rank list ───────────────────────────────────────── */
function BundeslandList({ allKreise, currentAgs, bundesland }: {
  allKreise: EmploymentDTO[];
  currentAgs: string;
  bundesland: string;
}) {
  const C = useThemeColors();
  const navigate = useNavigate();
  const itemRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    itemRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [currentAgs]);

  if (!allKreise.length) return null;

  return (
    <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
      <CardHeader title={`${bundesland} — Kreisvergleich`} badge={`${allKreise.length} Kreise`} badgeStyle="neutral" />
      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {allKreise.map((d, i) => {
          const isCurrent = d.ags === currentAgs;
          const alq = d.unemploymentRate ?? 0;
          const barWidth = Math.min((alq / 15) * 100, 100);
          return (
            <button
              key={d.ags}
              ref={isCurrent ? itemRef : null}
              onClick={() => navigate(kreisPath(d.ags))}
              style={{
                width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', padding: '7px 12px',
                background: isCurrent ? C.accentBg : 'none',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = C.bgCard2; }}
              onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'none'; }}
            >
              <span style={{ fontSize: 10, color: C.text5, width: 20, flexShrink: 0, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? C.accent : C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.districtName}
                  </span>
                  {isCurrent && <span style={{ fontSize: 9, fontWeight: 700, color: C.accent, background: C.accentBg, borderRadius: 3, padding: '1px 4px', flexShrink: 0 }}>HIER</span>}
                </div>
                <div style={{ background: C.bgGrid, borderRadius: 999, height: 3, marginTop: 3 }}>
                  <div style={{ width: `${barWidth}%`, height: '100%', borderRadius: 999, background: alqColor(alq) }} />
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: alqColor(alq), flexShrink: 0, fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right' }}>
                {d.unemploymentRate != null ? `${d.unemploymentRate}%` : '—'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


/* ── Main page ──────────────────────────────────────────────────── */
export function KreisPage() {
  const { isMobile, isTablet } = useBreakpoint();
  const C = useThemeColors();
  const { stateSlug, kreisSlug, ags: agsParam } = useParams<{ stateSlug?: string; kreisSlug?: string; ags?: string }>();
  const ags = stateSlug && kreisSlug ? kreisAgsFromSlugs(stateSlug, kreisSlug) ?? agsParam : agsParam;
  const [data, setData]         = useState<EmploymentDTO | null>(null);
  const [loading, setLoading]   = useState(true);
  const [errorKind, setErrorKind] = useState<'not-found' | 'network' | null>(null);
  const [weather, setWeather]   = useState<{ temp: number; condition: string } | null>(null);

  const bundesland = ags ? getBundesland(ags) : '';
  const blPrefix   = ags?.slice(0, 2) ?? '';

  const { data: allEmployment } = useEmployment();
  const { data: demographics, loading: demLoading } = useDemographics(ags);
  const { data: renewables, loading: renLoading } = useRenewables(ags);
  const { data: election, loading: elecLoading } = useElection(ags);
  const { data: vehicles, loading: vehLoading } = useVehicles(ags);
  const [jobPage, setJobPage] = useState(1);
  const [jobFilters, setJobFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [keywordInput, setKeywordInput] = useState('');
  const { jobs, total: jobTotal, loading: jobLoading, error: jobError } = useJobListings(data?.districtName, jobPage, jobFilters);
  const { data: vacancies, loading: vacLoading } = useVacancies(ags);
  const { data: employmentExtended } = useEmploymentExtended(ags);
  const { data: natpop } = useNatPop(ags);
  const { data: gdp } = useGdp(ags);
  const { data: broadband } = useBroadband(ags);
  const { data: commuters } = useCommuters(ags);
  const { data: housing } = useHousing(ags);
  const { data: healthcare } = useHealthcare(ags);
  const { data: transit } = useTransit(ags);
  const { data: social } = useSocial(ags);
  const { data: education } = useEducation(ags);
  const { data: accessibility } = useAccessibility(ags);
  const { data: ev } = useEv(ags);
  const { data: populationDynamics } = usePopulationDynamics(ags);
  const { data: fuel } = useFuel(ags);
  const { data: cluster } = useCluster(ags);
  const { data: news, loading: newsLoading } = useNews(ags, data?.districtName);
  const [activeTab, setActiveTab] = useState<'uebersicht' | 'arbeit' | 'bevoelkerung' | 'gesellschaft' | 'energie' | 'aktuelles'>('uebersicht');

  useEffect(() => {
    if (!ags) return;
    setLoading(true); setErrorKind(null); setWeather(null); setJobPage(1); setJobFilters(DEFAULT_FILTERS); setKeywordInput('');
    api.employment.byAgs(ags)
      .then(d => { setData(d); setLoading(false); })
      .catch((err: Error) => {
        setErrorKind(
          err.message.includes('503') || err.message.includes('data_not_ready') || err.message.includes('404')
            ? 'not-found' : 'network'
        );
        setLoading(false);
      });
    api.weather.byAgs(ags)
      .then(d => setWeather({ temp: Number(d.temperature), condition: d.condition ?? '' }))
      .catch(() => {});
  }, [ags]);


  const comparison = useMemo((): Comparison | null => {
    if (!allEmployment || !data?.unemploymentRate) return null;
    const valid = allEmployment.filter(d => d.unemploymentRate != null);
    if (!valid.length) return null;
    const sorted      = [...valid].sort((a, b) => a.unemploymentRate! - b.unemploymentRate!);
    const rank        = sorted.findIndex(d => d.ags === ags) + 1;
    const nationalAvg = valid.reduce((s, d) => s + d.unemploymentRate!, 0) / valid.length;
    const blKreise    = valid.filter(d => d.ags.startsWith(blPrefix));
    const blAvg       = blKreise.reduce((s, d) => s + d.unemploymentRate!, 0) / (blKreise.length || 1);
    const blSorted    = [...blKreise].sort((a, b) => a.unemploymentRate! - b.unemploymentRate!);
    const blRank      = blSorted.findIndex(d => d.ags === ags) + 1;
    return { rank: rank || 0, total: valid.length, nationalAvg, blAvg, blRank: blRank || 0, blTotal: blKreise.length };
  }, [allEmployment, data, ags, blPrefix]);

  const blKreiseSorted = useMemo(() => {
    if (!allEmployment) return [];
    return [...allEmployment.filter(d => d.ags.startsWith(blPrefix) && d.unemploymentRate != null)]
      .sort((a, b) => a.unemploymentRate! - b.unemploymentRate!);
  }, [allEmployment, blPrefix]);

  const kreisName      = loading ? null : data?.districtName ?? (ags ? `AGS ${ags}` : '—');
  const isNetworkError = errorKind === 'network';

  useEffect(() => {
    if (!ags || !kreisName) return;
    const origin = window.location.origin;
    const img = `${origin}/posters/${ags}.png`;
    const title = `${kreisName} — Für Alle`;
    const desc = `Arbeitslosigkeit, BIP, Demografie und mehr für ${kreisName} (AGS ${ags})`;
    document.title = title;
    const set = (prop: string, val: string, attr = 'property') => {
      let el = document.querySelector(`meta[${attr}="${prop}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, prop); document.head.appendChild(el); }
      el.setAttribute('content', val);
    };
    set('og:title', title); set('og:description', desc); set('og:image', img); set('og:url', window.location.href);
    set('twitter:card', 'summary_large_image', 'name'); set('twitter:image', img, 'name'); set('twitter:title', title, 'name');
    return () => { document.title = 'Für Alle'; };
  }, [ags, kreisName]);

  const blNavIndex  = blKreiseSorted.findIndex(d => d.ags === ags);
  const blNavPrev   = blNavIndex > 0 ? blKreiseSorted[blNavIndex - 1] : null;
  const blNavNext   = blNavIndex >= 0 && blNavIndex < blKreiseSorted.length - 1 ? blKreiseSorted[blNavIndex + 1] : null;
  const alq           = data?.unemploymentRate ?? null;

  return (
    <div style={{ background: C.bgPage }}>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div style={{
        padding: isMobile ? '16px 16px 28px' : '24px 24px 36px',
        position: 'relative',
        background: ags
          ? `linear-gradient(rgba(4,8,22,0.70), rgba(4,8,22,0.70)), url(/posters/${ags}.png) center top / auto no-repeat, #060d1f`
          : C.bgPage,
      }}>

        {/* Breadcrumb row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: 600 }}>Übersicht</Link>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <Link to={`/bundeslaender/${codeToSlug(blPrefix)}`} style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              {BL_META[blPrefix]?.wappen && (
                <img src={BL_META[blPrefix].wappen} alt="" style={{ height: 14, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1) opacity(0.8)' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              )}
              {bundesland || '…'}
            </Link>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#fff', fontWeight: 700 }}>{loading ? '…' : kreisName}</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {weather && !isNetworkError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '4px 10px', backdropFilter: 'blur(8px)' }}>
                <span style={{ fontSize: 16 }}>{COND_ICONS[weather.condition] ?? '🌤️'}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}><AnimatedNumber value={weather.temp} format={n => `${Math.round(n)}°`} duration={600} /></span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{COND_LABELS[weather.condition] ?? ''}</span>
              </div>
            )}
            <Link to={`/share/${ags}`} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 7, padding: '5px 12px', fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500, textDecoration: 'none', backdropFilter: 'blur(8px)' }}>
              ↗ Teilen
            </Link>
            <Link to={`/bundeslaender/${codeToSlug(blPrefix)}`} style={{ background: 'rgba(37,99,235,0.35)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: 7, padding: '5px 12px', fontSize: 12, color: '#93c5fd', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)' }}>
              {BL_META[blPrefix]?.wappen && (
                <img src={BL_META[blPrefix].wappen} alt="" style={{ height: 16, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1) opacity(0.8)' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              )}
              ← {bundesland || 'Bundesland'}
            </Link>
          </div>
        </div>

        {/* Title + badge row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            {loading ? (
              <div className="skeleton-wave" style={{ height: 36, width: 260, borderRadius: 8, marginBottom: 8 }} />
            ) : (
              <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: isNetworkError ? '#fca5a5' : '#fff', margin: '0 0 6px', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                {isNetworkError ? 'Verbindungsfehler' : kreisName}
              </h1>
            )}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {bundesland && (
                <span style={{ background: 'rgba(37,99,235,0.35)', color: '#93c5fd', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, border: '1px solid rgba(96,165,250,0.4)' }}>
                  {bundesland}
                </span>
              )}
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 500 }}>AGS {ags}</span>
              {errorKind === 'not-found' && (
                <span style={{ background: 'rgba(217,119,6,0.25)', color: '#fcd34d', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600, border: '1px solid rgba(252,211,77,0.3)' }}>
                  Beschäftigungsdaten ausstehend
                </span>
              )}
            </div>
          </div>
          {alq != null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: alqColor(alq), letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {alq}<span style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}> %</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, marginTop: 2 }}>Arbeitslosenquote</div>
            </div>
          )}
        </div>

        {/* ── Stat cards strip ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(6, minmax(0, 1fr))', gap: 10, marginBottom: 0 }}>
          {/* ALQ label card */}
          <div style={{ padding: '13px 15px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>ALQ-Einordnung</div>
            {loading ? <div className="skeleton-wave" style={{ height: 22, width: 60, borderRadius: 4 }} />
              : alq != null ? (
                <>
                  <div style={{ fontSize: 22, fontWeight: 800, color: alqColor(alq), lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    <AnimatedNumber value={alq} format={n => `${n.toFixed(1)} %`} />
                  </div>
                  <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 700, color: alqColor(alq), background: alqBg(alq), borderRadius: 5, padding: '2px 7px', display: 'inline-block' }}>{alqLabel(alq)}</div>
                </>
              ) : <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>—</div>}
          </div>

          {/* Arbeitslose */}
          <div style={{ padding: '13px 15px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Arbeitslose</div>
            {loading ? <div className="skeleton-wave" style={{ height: 22, width: 70, borderRadius: 4 }} />
              : <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  <AnimatedNumber
                    value={data?.unemployed ?? null}
                    format={n => n >= 10000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toLocaleString('de-DE')}
                  />
                </div>}
            <div style={{ marginTop: 5, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Personen</div>
          </div>

          {/* Bundesrang */}
          <div style={{ padding: '13px 15px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Bundesrang</div>
            {!comparison ? <div className="skeleton-wave" style={{ height: 22, width: 60, borderRadius: 4 }} />
              : comparison.rank > 0 ? (
                <>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>Platz </span>
                    <AnimatedNumber value={comparison.rank} format={n => String(Math.round(n))} />
                  </div>
                  <div style={{ marginTop: 5, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>von {comparison.total} Kreisen</div>
                </>
              ) : <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>—</div>}
          </div>

          {/* vs. Bund */}
          <div style={{ padding: '13px 15px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>vs. Bundesschnitt</div>
            {!comparison || alq == null ? <div className="skeleton-wave" style={{ height: 22, width: 60, borderRadius: 4 }} />
              : (() => {
                const diff = alq - comparison.nationalAvg;
                const pos = diff > 0;
                return (
                  <>
                    <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: pos ? '#f87171' : '#4ade80' }}>
                      <AnimatedNumber value={diff} format={n => `${n > 0 ? '+' : ''}${n.toFixed(1)}`} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}> PP</span>
                    </div>
                    <div style={{ marginTop: 5, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Ø Bund {comparison.nationalAvg.toFixed(1)} %</div>
                  </>
                );
              })()}
          </div>

          {/* Einwohner */}
          <div style={{ padding: '13px 15px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Einwohner</div>
            {demLoading ? <div className="skeleton-wave" style={{ height: 22, width: 60, borderRadius: 4 }} />
              : demographics?.population != null ? (
                <>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    <AnimatedNumber
                      value={demographics.population}
                      format={n => n >= 1_000_000
                        ? `${(n / 1_000_000).toFixed(2)} Mio.`
                        : n >= 1000
                          ? `${(n / 1000).toFixed(1)}k`
                          : Math.round(n).toLocaleString('de-DE')}
                    />
                  </div>
                  <div style={{ marginTop: 5, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Zensus 2022</div>
                </>
              ) : <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>—</div>}
          </div>

          {/* Fläche */}
          <div style={{ padding: '13px 15px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Fläche</div>
            {demLoading ? <div className="skeleton-wave" style={{ height: 22, width: 60, borderRadius: 4 }} />
              : demographics?.areaKm2 != null ? (
                <>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    <AnimatedNumber
                      value={Number(demographics.areaKm2)}
                      format={n => Math.round(n).toLocaleString('de-DE')}
                    />
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}> km²</span>
                  </div>
                  {demographics.populationDensity != null && (
                    <div style={{ marginTop: 5, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                      <AnimatedNumber value={Number(demographics.populationDensity)} format={n => `${Math.round(n)} Ew./km²`} />
                    </div>
                  )}
                </>
              ) : <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>—</div>}
          </div>
        </div>

        {/* ── Prev / next within Bundesland ──────────────────── */}
        {(blNavPrev || blNavNext) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em', textTransform: 'uppercase', flexShrink: 0 }}>
              {bundesland}
            </span>
            <div style={{ flex: 1, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              {blNavPrev ? (
                <Link
                  to={kreisPath(blNavPrev.ags)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8, padding: '6px 12px', textDecoration: 'none',
                    backdropFilter: 'blur(10px)', transition: 'background 0.13s',
                  }}
                >
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>←</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 1 }}>Niedrigere ALQ</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {blNavPrev.districtName}
                      </div>
                      <div style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {blNavPrev.unemploymentRate?.toFixed(1)} %
                      </div>
                    </div>
                  </Link>
                ) : <div />}
                {blNavNext ? (
                  <Link
                    to={kreisPath(blNavNext.ags)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8, padding: '6px 12px', textDecoration: 'none',
                      backdropFilter: 'blur(10px)', transition: 'background 0.13s',
                    }}
                  >
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 1 }}>Höhere ALQ</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {blNavNext.districtName}
                      </div>
                      <div style={{ fontSize: 10, color: '#f87171', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {blNavNext.unemploymentRate?.toFixed(1)} %
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>→</span>
                  </Link>
                ) : <div />}
              </div>
          </div>
        )}
        {/* Fade to page bg */}
        {ags && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, background: `linear-gradient(to bottom, transparent, ${C.bgPage})`, pointerEvents: 'none' }} />}
      </div>


      {/* ── Tab navigation — sticky below TopBar ─────────────────── */}
      <div className="sticky top-[52px] z-[25] bg-base-100 border-b border-base-200 shadow-sm overflow-x-auto">
        <div className="px-4 lg:px-6 py-2 flex justify-center">
          <div role="tablist" className="tabs tabs-box tabs-sm">
            {([
              { id: 'uebersicht',    label: 'Übersicht',           value: null },
              { id: 'arbeit',        label: 'Arbeitsmarkt',        value: alq != null ? `${alq} %` : null },
              { id: 'bevoelkerung',  label: 'Bevölkerung',         value: demographics?.population != null ? `${(demographics.population / 1000).toFixed(0)}k` : null },
              { id: 'gesellschaft',  label: 'Gesellschaft',        value: social?.incomeMonthlyEur != null ? `${Number(social.incomeMonthlyEur).toLocaleString('de-DE')} €` : null },
              { id: 'energie',       label: 'Energie & Mobilität', value: renewables ? `${(renewables.solarKwp / 1000).toFixed(0)} MWp` : null },
              { id: 'aktuelles',     label: 'Aktuelles',           value: null },
            ] as { id: string; label: string; value: string | null }[]).map(tab => (
              <button
                key={tab.id}
                role="tab"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`tab gap-2 text-[12px] whitespace-nowrap ${activeTab === tab.id ? 'tab-active font-bold' : ''}`}
              >
                {tab.label}
                {tab.value && (
                  <span className={`badge badge-sm ${activeTab === tab.id ? 'badge-primary' : 'badge-ghost'} tabular-nums`}>
                    {tab.value}
                  </span>
                )}
              </button>
            ))}
            {/* Nachrichten — links to dedicated page */}
            <Link
              to={`${kreisPath(ags!)}/nachrichten`}
              role="tab"
              className="tab gap-1.5 text-[12px] whitespace-nowrap"
            >
              Nachrichten
              {news.length > 0 && (
                <span className="badge badge-ghost badge-sm tabular-nums">{news.length}</span>
              )}
            </Link>
            {/* Stellen — links to dedicated page */}
            <Link
              to={`${kreisPath(ags!)}/stellen`}
              role="tab"
              className="tab gap-1.5 text-[12px] whitespace-nowrap"
            >
              Stellen
              {jobTotal != null && (
                <span className="badge badge-ghost badge-sm tabular-nums">{jobTotal.toLocaleString('de-DE')}</span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div style={{ background: C.bgPage }}>
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '20px 16px 48px' : '28px 24px 64px' }}>

          {/* Error alerts */}
          {isNetworkError && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <span>API nicht erreichbar. Bitte Dienste neu starten.</span>
              <button className="btn btn-sm" onClick={() => window.location.reload()}>Neu laden</button>
            </div>
          )}
          {errorKind === 'not-found' && (
            <div className="alert alert-warning" style={{ marginBottom: 20, fontSize: 13 }}>
              <span>Beschäftigungsdaten für diesen Landkreis wurden noch nicht geladen.</span>
              <Link to="/#anfragen" className="btn btn-sm btn-warning">Daten anfragen</Link>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
               TAB: ÜBERSICHT
          ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'uebersicht' && (<>

          {/* ─── Map + comparison ──────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 16, alignItems: 'start', marginBottom: 32 }}>
            <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>📍 Lage & Umgebung</span>
                <span style={{ fontSize: 11, color: C.text4 }}>{bundesland}</span>
              </div>
              <KreisMap data={allEmployment ?? []} interactive height={320} focusAgs={ags} showLegend={false} />
              <div style={{ padding: '5px 14px', borderTop: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Klicken zum Navigieren · Blauer Rahmen = dieser Kreis</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {alq != null && comparison && (
                <ComparisonCard alq={alq} cmp={comparison} bundesland={bundesland} />
              )}
              {blKreiseSorted.length > 0 && ags && (
                <BundeslandList allKreise={blKreiseSorted} currentAgs={ags} bundesland={bundesland} />
              )}
            </div>
          </div>

          {/* ─── Kreistyp & Ähnliche Kreise ────────────────────────── */}
          {cluster && (
            <section id="kreistyp" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
              <SectionHeader
                title="Kreistyp & Ähnliche Kreise"
                source="ML K-Means · 18 Merkmale · wöchentlich"
                note="Maschinelles Lernen auf sozioökonomischen Daten (Beschäftigung, BIP, Demografie, Infrastruktur u. a.)"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Cluster badge */}
                <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '20px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: cluster.clusterColor + '22',
                      border: `2px solid ${cluster.clusterColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: cluster.clusterColor }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: C.text1, letterSpacing: '-0.3px' }}>
                        {cluster.clusterLabel}
                      </div>
                      <div style={{ fontSize: 12, color: C.text3, marginTop: 3 }}>
                        Strukturtyp basierend auf 18 sozioökonomischen Merkmalen · Cluster {cluster.clusterId + 1} von 6
                      </div>
                    </div>
                  </div>
                </div>

                {/* Similar Kreise */}
                {cluster.similarKreise && cluster.similarKreise.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                      Ähnlichste Kreise
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)', gap: 10 }}>
                      {cluster.similarKreise.map(sim => (
                        <Link
                          key={sim.ags}
                          to={kreisPath(sim.ags)}
                          style={{ textDecoration: 'none' }}
                        >
                          <div
                            className="card bg-base-100 shadow-xs border border-base-200"
                            style={{
                              padding: '14px 14px',
                              transition: 'all 0.15s ease',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: sim.cluster_color, flexShrink: 0 }} />
                              <span style={{ fontSize: 10, color: sim.cluster_color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {sim.cluster_label}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text1, lineHeight: 1.3, marginBottom: 6 }}>
                              {sim.district_name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{
                                flex: 1, height: 3, background: C.bgGrid, borderRadius: 2, overflow: 'hidden',
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${Math.round(sim.similarity * 100)}%`,
                                  background: sim.cluster_color,
                                  borderRadius: 2,
                                }} />
                              </div>
                              <span style={{ fontSize: 10, color: '#94a3b8', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                                {Math.round(sim.similarity * 100)} %
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          </>)}

          {/* ═══════════════════════════════════════════════════════════
               TAB: ARBEITSMARKT
          ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'arbeit' && (<>

          {/* ─── Arbeitsmarkt ──────────────────────────────────────── */}
          <section id="arbeitsmarkt" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Arbeitsmarkt" source="Bundesagentur für Arbeit · monatlich" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Employment stats */}
              {!errorKind && (
                <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Arbeitslosenquote
                      </div>
                      {loading ? <SkeletonText width="60%" /> : (
                        <div>
                          <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: alq != null ? alqColor(alq) : '#0f172a' }}>
                            {alq ?? '—'}<span style={{ fontSize: 16, fontWeight: 500, color: C.text3, marginLeft: 2 }}>%</span>
                          </div>
                          {alq != null && (
                            <span style={{ display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 700, color: alqColor(alq), background: alqBg(alq), borderRadius: 5, padding: '3px 8px' }}>
                              {alqLabel(alq)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', padding: '16px 20px' }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Arbeitslose</div>
                      {loading ? <SkeletonText width="60%" /> : (
                        <div style={{ fontSize: 30, fontWeight: 800, color: C.text1, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                          <AnimatedNumber value={data?.unemployed ?? null} format={n => Math.round(n).toLocaleString('de-DE')} />
                        </div>
                      )}
                      {data?.unemployed != null && (
                        <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>Personen</div>
                      )}
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Datenstand</div>
                      {loading ? <SkeletonText width="60%" /> : (
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text1 }}>{data?.dataDate ?? '—'}</div>
                      )}
                      {comparison && alq != null && (
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                          <AnimatedNumber value={alq - comparison.nationalAvg} format={n => `${n > 0 ? '+' : ''}${n.toFixed(1)} PP ggü. Bund`} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Vacancies */}
              {!vacLoading && vacancies && (vacancies.openPositions != null || vacancies.reportedPositions != null) && (
                <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
                  <CardHeader title="📋 Gemeldete Stellen" badge="Bundesagentur · monatlich" badgeStyle="neutral" />
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Offene Stellen</div>
                      <div style={{ fontSize: 30, fontWeight: 800, color: C.text1, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                        <AnimatedNumber value={vacancies.openPositions ?? null} format={n => Math.round(n).toLocaleString('de-DE')} />
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>sofort besetzbar</div>
                    </div>
                    <div style={{ borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', padding: '16px 20px' }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Gemeldete Stellen</div>
                      <div style={{ fontSize: 30, fontWeight: 800, color: C.text1, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                        <AnimatedNumber value={vacancies.reportedPositions ?? null} format={n => Math.round(n).toLocaleString('de-DE')} />
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>alle gemeldeten</div>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Ø Vakanzzeit</div>
                      <div style={{ fontSize: 30, fontWeight: 800, color: C.text1, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                        <AnimatedNumber value={vacancies.avgVacancyDays != null ? Number(vacancies.avgVacancyDays) : null} format={n => Math.round(n).toString()} />
                        {vacancies.avgVacancyDays != null && <span style={{ fontSize: 14, fontWeight: 500, color: C.text3, marginLeft: 3 }}>Tage</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>durchschn. Besetzungsdauer</div>
                    </div>
                  </div>
                  <div style={{ padding: '6px 16px 8px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Stand: {vacancies.dataDate ?? '—'} · Bundesagentur für Arbeit</p>
                  </div>
                </div>
              )}

              {/* Job listings */}

              {/* Filter bar */}
              <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200 p-3 mb-3">
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  <form
                    onSubmit={e => { e.preventDefault(); setJobPage(1); setJobFilters(f => ({ ...f, keyword: keywordInput })); }}
                    className="flex flex-1 min-w-32"
                  >
                    <input
                      type="text"
                      placeholder="Berufsbezeichnung…"
                      value={keywordInput}
                      onChange={e => setKeywordInput(e.target.value)}
                      className="input input-xs input-bordered rounded-r-none flex-1 focus:outline-none focus:border-primary"
                    />
                    <button type="submit" className="btn btn-xs btn-primary rounded-l-none">Suche</button>
                    {jobFilters.keyword && (
                      <button type="button" onClick={() => { setKeywordInput(''); setJobPage(1); setJobFilters(f => ({ ...f, keyword: '' })); }}
                        className="btn btn-xs btn-ghost ml-1">✕</button>
                    )}
                  </form>
                  <div className="join">
                    {(['10', '25', '50', '100'] as const).map(r => (
                      <button key={r} onClick={() => { setJobPage(1); setJobFilters(f => ({ ...f, radius: r })); }}
                        className={`join-item btn btn-xs ${jobFilters.radius === r ? 'btn-primary' : 'btn-ghost border border-base-200'}`}>{r} km</button>
                    ))}
                  </div>
                  <div className="join">
                    {([{ value: '1', label: 'Arbeit' }, { value: '2', label: 'Ausbildung' }, { value: '4', label: 'Praktikum' }] as const).map(opt => (
                      <button key={opt.value} onClick={() => { setJobPage(1); setJobFilters(f => ({ ...f, angebotsart: opt.value })); }}
                        className={`join-item btn btn-xs ${jobFilters.angebotsart === opt.value ? 'btn-primary' : 'btn-ghost border border-base-200'}`}>{opt.label}</button>
                    ))}
                  </div>
                  {jobTotal != null && <span className="text-[11px] text-base-content/40 tabular-nums ml-auto">{jobTotal.toLocaleString('de-DE')} Treffer</span>}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="join">
                    {([{ value: '', label: 'Alle' }, { value: 'vz', label: 'Vollzeit' }, { value: 'tz', label: 'Teilzeit' }, { value: 'ho', label: 'Homeoffice' }, { value: 'mj', label: 'Minijob' }] as const).map(opt => (
                      <button key={opt.value} onClick={() => { setJobPage(1); setJobFilters(f => ({ ...f, arbeitszeit: opt.value })); }}
                        className={`join-item btn btn-xs ${jobFilters.arbeitszeit === opt.value ? 'btn-primary' : 'btn-ghost border border-base-200'}`}>{opt.label}</button>
                    ))}
                  </div>
                  <div className="join">
                    {([{ value: '', label: 'Alle' }, { value: '1', label: 'Heute' }, { value: '7', label: 'Woche' }, { value: '30', label: 'Monat' }] as const).map(opt => (
                      <button key={opt.value} onClick={() => { setJobPage(1); setJobFilters(f => ({ ...f, veroeffentlichtseit: opt.value })); }}
                        className={`join-item btn btn-xs ${jobFilters.veroeffentlichtseit === opt.value ? 'btn-primary' : 'btn-ghost border border-base-200'}`}>{opt.label}</button>
                    ))}
                  </div>
                  <div className="join ml-auto">
                    {([{ value: '1', label: 'Relevanz' }, { value: '4', label: 'Neueste' }] as const).map(opt => (
                      <button key={opt.value} onClick={() => { setJobPage(1); setJobFilters(f => ({ ...f, sort: opt.value })); }}
                        className={`join-item btn btn-xs ${jobFilters.sort === opt.value ? 'btn-primary' : 'btn-ghost border border-base-200'}`}>{opt.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results */}
              {jobError ? (
                <div className="alert alert-error text-sm">Stellendaten konnten nicht geladen werden.</div>
              ) : jobs.length === 0 && jobLoading ? (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="card bg-base-100 border border-base-200 shadow-sm p-4 flex flex-col gap-3">
                      <div className="skeleton h-4 w-3/4 rounded" />
                      <div className="skeleton h-3 w-1/2 rounded" />
                      <div className="flex gap-2 mt-auto"><div className="skeleton h-3 w-16 rounded" /><div className="skeleton h-3 w-20 rounded" /></div>
                    </div>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <p className="text-sm text-base-content/40 py-8 text-center">Keine Stellenangebote gefunden.</p>
              ) : (
                <>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {jobs.map(job => {
                      const url = job.externeUrl
                        ?? `https://www.arbeitsagentur.de/jobsuche/suche?was=${encodeURIComponent(job.titel ?? '')}&wo=${encodeURIComponent(data?.districtName?.split(',')[0] ?? '')}&umkreis=25&angebotsart=1`;
                      const isExtern = !!job.externeUrl;
                      const daysAgo = job.publishedDate
                        ? Math.floor((Date.now() - new Date(job.publishedDate).getTime()) / 86_400_000)
                        : null;
                      const isStale = daysAgo != null && daysAgo > 14;
                      const ARBEITSZEIT: Record<string, string> = {
                        'Vollzeit': 'badge-info', 'Teilzeit': 'badge-success',
                        'Heimarbeit/Fernarbeit': 'badge-secondary', 'Minijob': 'badge-warning',
                      };
                      const daysLabel = daysAgo === 0 ? 'heute' : daysAgo === 1 ? 'gestern' : daysAgo != null ? `vor ${daysAgo} T.` : '';
                      return (
                        <a key={job.refnr} href={url} target="_blank" rel="noopener noreferrer" className="no-underline">
                          <div className={`card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 hover:-translate-y-0.5 transition-all duration-200 p-4 h-full flex flex-col gap-2 cursor-pointer ${isStale ? 'opacity-60' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-semibold text-base-content leading-snug flex-1">{job.titel}</span>
                              <div className="flex items-center gap-1 shrink-0 mt-0.5 flex-wrap justify-end">
                                {isStale && <span className="badge badge-warning badge-xs">mögl. besetzt</span>}
                                {!isExtern && <span className="badge badge-ghost badge-xs">BA-intern</span>}
                                {daysLabel && <span className="badge badge-ghost badge-xs">{daysLabel}</span>}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-primary leading-tight">{job.arbeitgeber}</div>
                            <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                              {job.ort && <span className="text-xs text-base-content/40">📍 {job.ort}</span>}
                              {job.arbeitszeit && ARBEITSZEIT[job.arbeitszeit] && (
                                <span className={`badge badge-xs ${ARBEITSZEIT[job.arbeitszeit]}`}>{
                                  job.arbeitszeit === 'Heimarbeit/Fernarbeit' ? 'Homeoffice' : job.arbeitszeit
                                }</span>
                              )}
                              {job.beruf && job.beruf !== job.titel && (
                                <span className="badge badge-ghost badge-xs">{job.beruf}</span>
                              )}
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-base-200">
                    {jobTotal != null && jobs.length < jobTotal ? (
                      <button onClick={() => setJobPage(p => p + 1)} disabled={jobLoading} className="btn btn-sm btn-outline btn-primary">
                        {jobLoading ? <><span className="loading loading-spinner loading-xs" /> Lädt…</> : `${jobs.length} von ${jobTotal.toLocaleString('de-DE')} — mehr laden`}
                      </button>
                    ) : (
                      <span className="text-xs text-base-content/40">{jobs.length} Stellen geladen</span>
                    )}
                    <a href={`https://www.arbeitsagentur.de/jobsuche/suche?wo=${encodeURIComponent(data?.districtName?.split(',')[0] ?? '')}&umkreis=25&angebotsart=1`}
                      target="_blank" rel="noopener noreferrer" className="text-xs text-base-content/40 hover:text-base-content/70 no-underline transition-colors">
                      Alle auf arbeitsagentur.de →
                    </a>
                  </div>
                  <p className="text-[10px] text-base-content/25 mt-2">Quelle: Bundesagentur für Arbeit Jobbörse · Umkreis 25 km · live</p>
                </>
              )}
            </div>
          </section>

          {/* end arbeit tab */}
          </>)}

          {/* ═══════════════════════════════════════════════════════════
               TAB: BEVÖLKERUNG
          ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'bevoelkerung' && (<>

          {/* ─── Bevölkerung ───────────────────────────────────────── */}
          <section id="bevoelkerung" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Bevölkerung" source="Zensus 2022 · Destatis" />
            {demLoading ? (
              <SkeletonCard height={120} />
            ) : demographics ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 12 }}>
                {([
                  { label: 'Einwohner',          raw: demographics.population,                        fmt: (n: number) => Math.round(n).toLocaleString('de-DE'), sub: 'Personen' },
                  { label: 'Fläche',             raw: demographics.areaKm2 != null ? Number(demographics.areaKm2) : null, fmt: (n: number) => `${Math.round(n).toLocaleString('de-DE')} km²`, sub: 'Quadratkilometer' },
                  { label: 'Bevölkerungsdichte', raw: demographics.populationDensity != null ? Number(demographics.populationDensity) : null, fmt: (n: number) => `${Math.round(n)} Ew./km²`, sub: 'Einwohner je km²' },
                  { label: 'Privathaushalte',    raw: demographics.privateHouseholds,                 fmt: (n: number) => Math.round(n).toLocaleString('de-DE'), sub: 'Haushalte' },
                  { label: 'Haushaltsgröße',     raw: demographics.population != null && demographics.privateHouseholds != null && demographics.privateHouseholds > 0 ? demographics.population / demographics.privateHouseholds : null, fmt: (n: number) => n.toFixed(2), sub: 'Pers. je Haushalt' },
                ] as { label: string; raw: number | null; fmt: (n: number) => string; sub: string }[]).map(item => (
                  <div key={item.label} className="card bg-base-100 shadow-xs border border-base-200" style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{item.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.text1, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
                      <AnimatedNumber value={item.raw} format={item.fmt} />
                    </div>
                    <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 4 }}>{item.sub}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card bg-base-100 shadow-xs border border-base-200" style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                Bevölkerungsdaten noch nicht verfügbar
              </div>
            )}
          </section>

          {/* end bevoelkerung tab */}
          </>)}

          {/* ─── energie tab: renewables/weather/vehicles ─────────────── */}
          {activeTab === 'energie' && (<>

          {/* ─── Umwelt & Klima ────────────────────────────────────── */}
          <section id="umwelt" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Wetter & Luftqualität" source="DWD via Brightsky · Umweltbundesamt · stündlich" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              {!isNetworkError && ags && <WeatherCard ags={ags} />}
              {!isNetworkError && ags && <AirQualityCard ags={ags} />}
            </div>
          </section>

          {/* ─── Erneuerbare Energien ──────────────────────────────── */}
          <section id="erneuerbare" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Erneuerbare Energien" source="Marktstammdatenregister · wöchentlich" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {renLoading ? (
                <div style={{ padding: 20 }}><SkeletonCard height={120} /></div>
              ) : renewables ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 1, background: C.bgGrid }}>
                    {([
                      { icon: '☀️', label: 'Solar',    raw: renewables.solarKwp / 1000,   fmt: (n: number) => `${n.toFixed(1)} MWp`, sub: `${renewables.solarCount.toLocaleString('de-DE')} Anlagen`,  color: '#f59e0b' },
                      { icon: '💨', label: 'Wind',     raw: renewables.windKw / 1000,     fmt: (n: number) => `${n.toFixed(1)} MW`,  sub: `${renewables.windCount.toLocaleString('de-DE')} Turbinen`,  color: '#3b82f6' },
                      { icon: '🌱', label: 'Biomasse', raw: renewables.biomassKw / 1000,  fmt: (n: number) => `${n.toFixed(1)} MW`,  sub: `${renewables.biomassCount.toLocaleString('de-DE')} Anlagen`, color: '#16a34a' },
                      { icon: '🔌', label: 'EV-Lader', raw: renewables.evChargers,        fmt: (n: number) => Math.round(n).toLocaleString('de-DE'), sub: 'Ladepunkte', color: '#8b5cf6' },
                    ] as { icon: string; label: string; raw: number; fmt: (n: number) => string; sub: string; color: string }[]).map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: C.text1, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
                          <AnimatedNumber value={item.raw} format={item.fmt} />
                        </div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: item.color, marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  {demographics?.population != null && demographics.population > 0 && (
                    <div style={{ padding: '10px 16px 12px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 28, flexWrap: 'wrap', background: C.bgCard2 }}>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solar je Einw.</span>
                        <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 700, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                          <AnimatedNumber value={renewables.solarKwp / demographics.population} format={n => `${n.toFixed(2)} kWp`} />
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wind je 1.000 Einw.</span>
                        <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 700, color: '#3b82f6', fontVariantNumeric: 'tabular-nums' }}>
                          <AnimatedNumber value={(renewables.windKw / demographics.population) * 1000} format={n => `${n.toFixed(1)} kW`} />
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EV-Lader je 1.000 Einw.</span>
                        <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 700, color: '#8b5cf6', fontVariantNumeric: 'tabular-nums' }}>
                          <AnimatedNumber value={(renewables.evChargers / demographics.population) * 1000} format={n => n.toFixed(2)} />
                        </span>
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Bundesnetzagentur / Marktstammdatenregister · {renewables.dataDate ?? '—'}</p>
                  </div>
                </>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Daten noch nicht verfügbar</div>
              )}
            </div>
          </section>

          {/* ─── Fahrzeuge ─────────────────────────────────────────── */}
          <section id="fahrzeuge" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Fahrzeugbestand" source="Kraftfahrtbundesamt · quartalsweise" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {vehLoading ? (
                <div style={{ padding: 20 }}><SkeletonCard height={100} /></div>
              ) : vehicles ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 1, background: C.bgGrid }}>
                    {([
                      { icon: '🚗', label: 'PKW gesamt', raw: vehicles.carsTotal,                                    fmt: (n: number) => Math.round(n).toLocaleString('de-DE'), sub: 'Pkw' },
                      { icon: '📊', label: 'je 1.000 EW', raw: vehicles.carsPer1000 != null ? Number(vehicles.carsPer1000) : null, fmt: (n: number) => Math.round(n).toString(), sub: 'Pkw / 1.000 Einw.' },
                      { icon: '⚡', label: 'Elektro',    raw: vehicles.electric,                                     fmt: (n: number) => Math.round(n).toLocaleString('de-DE'), sub: vehicles.electricShare != null ? `${Number(vehicles.electricShare).toFixed(1)} % Anteil` : 'Pkw' },
                      { icon: '🔋', label: 'Hybrid',     raw: vehicles.hybrid,                                      fmt: (n: number) => Math.round(n).toLocaleString('de-DE'), sub: vehicles.hybridShare != null ? `${Number(vehicles.hybridShare).toFixed(1)} % Anteil` : 'Pkw' },
                    ] as { icon: string; label: string; raw: number | null; fmt: (n: number) => string; sub: string }[]).map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 26, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: C.text1, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
                          <AnimatedNumber value={item.raw} format={item.fmt} />
                        </div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Kraftfahrtbundesamt (KBA) · Stand: {vehicles.dataDate ?? '—'}</p>
                  </div>
                </>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Daten noch nicht verfügbar</div>
              )}
            </div>
            {ags && <SimilarByMetric metric="ev" currentAgs={ags} currentValue={vehicles?.electricShare} label="E-Auto-Anteil" unit="%" />}
          </section>

          {/* end energie tab block 1 */}
          </>)}

          {activeTab === 'energie' && (
            <section id="energie" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
              <SectionHeader title="Stromversorgung" source="SMARD · Bundesnetzagentur · 15-minütlich" />
              <EnergyPanel />
            </section>
          )}

          {activeTab === 'aktuelles' && (
            <section id="nachrichten" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
              <SectionHeader title="Lokale Nachrichten" source="Google News · alle 2 Stunden" />
              <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
                {newsLoading && <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: C.text5 }}>Nachrichten werden geladen…</div>}
                {!newsLoading && news.length === 0 && <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: C.text5 }}>Keine Nachrichten gefunden.</div>}
                {news.slice(0, 5).map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderBottom: i < Math.min(news.length, 5) - 1 ? `1px solid ${C.border}` : 'none', textDecoration: 'none', background: 'transparent', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bgCard2)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', flexShrink: 0, marginTop: 6 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text1, lineHeight: 1.4, marginBottom: 3 }}>{item.title}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {item.source && <span style={{ fontSize: 11, color: C.text4, fontWeight: 500 }}>{item.source}</span>}
                        {item.publishedAt && <span style={{ fontSize: 11, color: C.text5 }}>{item.publishedAt}</span>}
                      </div>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: 4, color: C.text5 }}>
                      <path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                ))}
                {news.length > 0 && (
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <Link
                      to={`${kreisPath(ags!)}/nachrichten`}
                      className="btn btn-xs btn-outline btn-primary"
                    >
                      Alle {news.length} Nachrichten →
                    </Link>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'aktuelles' && (
            <section id="infrastruktur" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
              <SectionHeader title="Infrastruktur" source="OpenStreetMap · live" />
              <InfrastructurePanel ags={ags} population={demographics?.population ?? undefined} />
            </section>
          )}

          {activeTab === 'aktuelles' && (
          <section id="politik" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Politik" source="Die Bundeswahlleiterin" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {elecLoading ? (
                <div style={{ padding: 20 }}><SkeletonCard height={180} /></div>
              ) : election ? (
                <>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Bundestagswahl {election.electionYear ?? '—'}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Wahlkreis: {election.constituencyName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: C.text3 }}>Wahlbeteiligung</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: C.text1, fontVariantNumeric: 'tabular-nums' }}>
                        <AnimatedNumber value={election.turnout != null ? Number(election.turnout) : null} format={n => `${n.toFixed(1)} %`} />
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    {[
                      { party: 'SPD',       value: election.spd,        color: '#e3000f' },
                      { party: 'CDU/CSU',   value: election.cduCsu,     color: '#161615' },
                      { party: 'Grüne',     value: election.greens,     color: '#46962b' },
                      { party: 'FDP',       value: election.fdp,        color: '#e5cc0b' },
                      { party: 'AfD',       value: election.afd,        color: '#009ee0' },
                      { party: 'Linke',     value: election.leftParty,  color: '#be3075' },
                      { party: 'Sonstige',  value: election.other,      color: '#94a3b8' },
                    ].filter(p => p.value != null && Number(p.value) >= 0.5).map(p => (
                      <div key={p.party} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.text1 }}>{p.party}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.text1, fontVariantNumeric: 'tabular-nums' }}>
                            <AnimatedNumber value={Number(p.value!)} format={n => `${n.toFixed(1)} %`} duration={700} />
                          </span>
                        </div>
                        <div style={{ background: C.bgGrid, borderRadius: 999, height: 8, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(Number(p.value!), 50) * 2}%`, height: '100%', borderRadius: 999, background: p.color, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '8px 20px 12px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>
                      Zweitstimmen · Quelle: Die Bundeswahlleiterin · Wahlkreisgrenzen entsprechen nicht exakt den Kreisgrenzen
                    </p>
                  </div>
                </>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Wahldaten noch nicht verfügbar</div>
              )}
            </div>
          </section>
          )}

          {activeTab === 'arbeit' && (<>
          {/* ─── Wirtschaft ────────────────────────────────────────── */}
          <section id="wirtschaft" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Wirtschaft" source="Regionaldatenbank · VGR · jährlich" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {!gdp ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Daten noch nicht verfügbar</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 1, background: C.bgGrid }}>
                    {[
                      { icon: '💰', label: 'BIP je Einwohner', value: gdp.gdpPerCapita != null ? `${gdp.gdpPerCapita.toLocaleString('de-DE')} €` : '—', sub: 'EUR / Einwohner', color: '#16a34a' },
                      { icon: '🏭', label: 'BIP gesamt', value: gdp.gdpTotalMillions != null ? `${(gdp.gdpTotalMillions / 1000).toFixed(1)} Mrd. €` : '—', sub: 'Milliarden EUR', color: C.text1 },
                      { icon: '📅', label: 'Datenjahr', value: gdp.dataYear != null ? String(gdp.dataYear) : '—', sub: 'Berichtsjahr', color: C.text3 },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  {employmentExtended && (
                    <div style={{ borderTop: `1px solid ${C.border}` }}>
                      <div style={{ padding: '8px 16px 4px', background: C.bgCard2 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Erweiterte Arbeitsmarktdaten · Bundesagentur für Arbeit</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 1, background: C.bgGrid }}>
                        {[
                          { label: 'Langzeitarbeitslose', value: employmentExtended.alqLongTerm != null ? `${Number(employmentExtended.alqLongTerm).toFixed(1)} %` : '—', sub: '> 1 Jahr arbeitslos' },
                          { label: 'Jugendarbeitslosigkeit', value: employmentExtended.alqYouth != null ? `${Number(employmentExtended.alqYouth).toFixed(1)} %` : '—', sub: 'U25 Arbeitslosenquote' },
                          { label: 'Ältere (55+)', value: employmentExtended.alqOlder != null ? `${Number(employmentExtended.alqOlder).toFixed(1)} %` : '—', sub: '55-<65 Jahre' },
                          { label: 'SGB-II-Quote', value: employmentExtended.sgb2Rate != null ? `${Number(employmentExtended.sgb2Rate).toFixed(1)} %` : '—', sub: 'Bürgergeld-Empfänger' },
                        ].map(item => (
                          <div key={item.label} style={{ background: C.bgCard, padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: C.text1, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, marginTop: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{item.sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>BIP: Volkswirtschaftliche Gesamtrechnung · Regionaldatenbank · {gdp.dataYear ?? '—'}</p>
                  </div>
                </>
              )}
            </div>
            {ags && <SimilarByMetric metric="gdp" currentAgs={ags} currentValue={gdp?.gdpPerCapita} label="BIP pro Kopf" unit="€" />}
          </section>
          </>)}

          {activeTab === 'energie' && (
          <section id="kraftstoff" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="⛽ Kraftstoffpreise" source="Tankerkönig · CC BY 4.0 · alle 3 Stunden" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {!fuel ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                  Daten noch nicht verfügbar — TANKERKOENIG_API_KEY in etl/.env eintragen
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 1, background: C.bgGrid }}>
                    {[
                      { icon: '🟢', label: 'Super E5',  value: fuel.e5Avg    != null ? `${Number(fuel.e5Avg).toFixed(3)} €/L`    : '—', sub: 'Ø Preis im Umkreis', color: '#16a34a' },
                      { icon: '🔵', label: 'E10',        value: fuel.e10Avg   != null ? `${Number(fuel.e10Avg).toFixed(3)} €/L`   : '—', sub: 'Ø Preis im Umkreis', color: '#2563eb' },
                      { icon: '🟡', label: 'Diesel',     value: fuel.dieselAvg != null ? `${Number(fuel.dieselAvg).toFixed(3)} €/L` : '—', sub: 'Ø Preis im Umkreis', color: '#d97706' },
                      { icon: '⛽', label: 'Tankstellen', value: fuel.stationCount != null ? `${fuel.stationCount}` : '—', sub: `im ${20}-km-Radius`, color: C.text3 },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '16px 20px' }}>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span>{item.icon}</span>{item.label}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: item.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                          {item.value}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 3 }}>{item.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#1e293b', padding: '10px 16px' }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>
                      Quelle: Tankerkönig · Markttransparenzstelle für Kraftstoffe · {fuel.fetchedAt ? new Date(fuel.fetchedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>
          )}

          {activeTab === 'bevoelkerung' && (
          <section id="bevoelk2" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Natürliche Bevölkerungsbewegung" source="Destatis · Regionaldatenbank · jährlich" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {!natpop ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Daten noch nicht verfügbar</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 1, background: C.bgGrid }}>
                    {[
                      { icon: '👶', label: 'Geburten', value: natpop.births != null ? natpop.births.toLocaleString('de-DE') : '—', sub: 'Lebendgeborene', color: '#16a34a' },
                      { icon: '⚰️', label: 'Sterbefälle', value: natpop.deaths != null ? natpop.deaths.toLocaleString('de-DE') : '—', sub: 'Gestorbene', color: '#dc2626' },
                      { icon: '📈', label: 'Natürl. Saldo', value: natpop.naturalChange != null ? (natpop.naturalChange > 0 ? '+' : '') + natpop.naturalChange.toLocaleString('de-DE') : '—', sub: 'Geburten − Sterbefälle', color: natpop.naturalChange != null ? (natpop.naturalChange >= 0 ? '#16a34a' : '#dc2626') : '#0f172a' },
                      { icon: '🍼', label: 'Geburtenrate', value: natpop.birthRate != null ? `${Number(natpop.birthRate).toFixed(1)} ‰` : '—', sub: 'je 1.000 Einwohner', color: C.text1 },
                      { icon: '📊', label: 'Sterberate', value: natpop.deathRate != null ? `${Number(natpop.deathRate).toFixed(1)} ‰` : '—', sub: 'je 1.000 Einwohner', color: C.text1 },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 26, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: item.color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Quelle: Statistisches Bundesamt (Destatis) · Regionaldatenbank · {natpop.dataYear ?? '—'}</p>
                  </div>
                </>
              )}
            </div>
          </section>
          )}

          {activeTab === 'gesellschaft' && (<>
          {/* ─── Digitale Infrastruktur ────────────────────────────── */}
          <section id="digital" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Digitale Infrastruktur" source="Bundesnetzagentur Breitbandatlas · jährlich" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {!broadband ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Daten noch nicht verfügbar</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 1, background: C.bgGrid }}>
                    {[
                      { icon: '📶', label: '≥ 100 Mbit/s', value: broadband.cov100Mbit != null ? `${Number(broadband.cov100Mbit).toFixed(1)} %` : '—', sub: 'Haushaltsabdeckung', color: '#2563eb' },
                      { icon: '🚀', label: '≥ 1 Gbit/s', value: broadband.cov1Gbit != null ? `${Number(broadband.cov1Gbit).toFixed(1)} %` : '—', sub: 'Gigabit-Versorgung', color: '#7c3aed' },
                      { icon: '🔌', label: 'Glasfaser (FTTH)', value: broadband.covFiber != null ? `${Number(broadband.covFiber).toFixed(1)} %` : '—', sub: 'Fiber to the Home', color: '#0891b2' },
                      { icon: '📱', label: '5G Mobilfunk', value: broadband.covMobile5g != null ? `${Number(broadband.covMobile5g).toFixed(1)} %` : '—', sub: 'Flächenabdeckung', color: '#059669' },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 26, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Quelle: Bundesnetzagentur Breitbandatlas · {broadband.dataYear ?? '—'}</p>
                  </div>
                </>
              )}
            </div>
            {ags && <SimilarByMetric metric="broadband" currentAgs={ags} currentValue={broadband?.cov100Mbit} label="Breitband ≥100 Mbit" unit="%" />}
          </section>
          </>)}

          {activeTab === 'arbeit' && (
          <section id="pendler" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Pendlerverflechtungen" source="Bundesagentur für Arbeit · Pendlerstatistik · jährlich" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {!commuters ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Daten noch nicht verfügbar</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 1, background: C.bgGrid }}>
                    {[
                      { icon: '→', label: 'Einpendler', value: commuters.commutersIn != null ? commuters.commutersIn.toLocaleString('de-DE') : '—', sub: 'Einpendler ins Kreisgebiet', color: '#16a34a' },
                      { icon: '←', label: 'Auspendler', value: commuters.commutersOut != null ? commuters.commutersOut.toLocaleString('de-DE') : '—', sub: 'Pendler aus dem Kreis', color: '#dc2626' },
                      { icon: '⚖️', label: 'Pendlersaldo', value: commuters.commuterBalance != null ? (commuters.commuterBalance > 0 ? '+' : '') + commuters.commuterBalance.toLocaleString('de-DE') : '—', sub: 'Ein- minus Auspendler', color: commuters.commuterBalance != null ? (commuters.commuterBalance >= 0 ? '#16a34a' : '#dc2626') : '#0f172a' },
                      { icon: '📊', label: 'Pendlerquotient', value: commuters.commuterRatio != null ? Number(commuters.commuterRatio).toFixed(2) : '—', sub: '>1 = mehr Ein- als Auspendler', color: C.text1 },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 26, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: item.color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Quelle: Bundesagentur für Arbeit · Pendlerstatistik · {commuters.dataYear ?? '—'}</p>
                  </div>
                </>
              )}
            </div>
          </section>
          )}

          {activeTab === 'gesellschaft' && (<>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
          {/* ─── Wohnen ────────────────────────────────────────────── */}
          <section id="wohnen" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Wohnungsmarkt" source="BBSR Wohnungsmarktbeobachtung · jährlich" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {!housing ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Daten noch nicht verfügbar</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 1, background: C.bgGrid }}>
                    {[
                      { icon: '🏠', label: 'Miete', value: housing.rentPerSqm != null ? `${Number(housing.rentPerSqm).toFixed(2)} €/m²` : '—', sub: 'Angebotsmiete je m²', color: '#dc2626' },
                      { icon: '🔑', label: 'Leerstandsquote', value: housing.vacancyRate != null ? `${Number(housing.vacancyRate).toFixed(1)} %` : '—', sub: 'Leerstehende Wohnungen', color: '#d97706' },
                      { icon: '📅', label: 'Datenjahr', value: housing.dataYear != null ? String(housing.dataYear) : '—', sub: 'Berichtsjahr', color: C.text3 },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Quelle: BBSR Wohnungsmarktbeobachtung · {housing.dataYear ?? '—'}</p>
                  </div>
                </>
              )}
            </div>
            {ags && <SimilarByMetric metric="rent" currentAgs={ags} currentValue={housing?.rentPerSqm} label="Angebotsmiete" unit="€/m²" />}
          </section>

          {/* ─── Gesundheitsversorgung ─────────────────────────────── */}
          <section id="gesundheit" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Gesundheitsversorgung" source="Regionaldatenbank · KBV · jährlich" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {!healthcare ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Daten noch nicht verfügbar</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 1, background: C.bgGrid }}>
                    {[
                      { icon: '🩺', label: 'Ärzte je 100.000 EW', value: healthcare.doctorsPer100k != null ? Number(healthcare.doctorsPer100k).toFixed(1) : '—', sub: 'Niedergelassene Ärzte', color: '#2563eb' },
                      { icon: '🏥', label: 'Krankenhausbetten', value: healthcare.hospitalBedsPer100k != null ? Number(healthcare.hospitalBedsPer100k).toFixed(1) : '—', sub: 'je 100.000 Einwohner', color: '#dc2626' },
                      { icon: '📅', label: 'Datenjahr', value: healthcare.dataYear != null ? String(healthcare.dataYear) : '—', sub: 'Berichtsjahr', color: C.text3 },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Quelle: Regionaldatenbank · Kassenärztliche Bundesvereinigung (KBV) · {healthcare.dataYear ?? '—'}</p>
                  </div>
                </>
              )}
            </div>
            {ags && <SimilarByMetric metric="doctors" currentAgs={ags} currentValue={healthcare?.doctorsPer100k} label="Ärzte je 100k" unit="" />}
          </section>
          </div>

          {/* ─── Bahn & ÖPNV ───────────────────────────────────────── */}
          <section id="bahn" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Bahn & ÖPNV" source="Deutsche Bahn · Bahnhofsliste" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {!transit ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Daten noch nicht verfügbar</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 1, background: C.bgGrid }}>
                    {[
                      { icon: '🚉', label: 'Bahnhöfe', value: transit.stationCount != null ? transit.stationCount.toLocaleString('de-DE') : '—', sub: 'DB-Bahnhöfe im Kreis', color: '#dc2626' },
                      { icon: '🚄', label: 'Fernverkehr', value: transit.hasLongDistance != null ? (transit.hasLongDistance ? 'Ja' : 'Nein') : '—', sub: 'IC/ICE-Halt vorhanden', color: transit.hasLongDistance ? '#16a34a' : '#94a3b8' },
                      { icon: '⭐', label: 'Beste Kategorie', value: transit.bestCategory != null ? `Kat. ${transit.bestCategory}` : 'Keine', sub: 'DB-Bahnhofskategorie (1=höchste)', color: '#2563eb' },
                      { icon: '📅', label: 'Datenstand', value: transit.dataDate ?? '—', sub: 'Stand der Bahnhofsliste', color: C.text3 },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Quelle: Deutsche Bahn AG · Bahnhofsliste · Stand: {transit.dataDate ?? '—'}</p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ─── Soziales ─────────────────────────────────────────── */}
          <section id="soziales" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Soziale Lage" source="BBSR INKAR 2025 · jährlich" note="INKAR 2025-Ausgabe — Datenjahr variiert je Indikator (i. d. R. 1–2 Jahre Verzug)" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {!social ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Daten noch nicht verfügbar</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 1, background: C.bgGrid }}>
                    {[
                      { icon: '💶', label: 'Haushaltseinkommen', value: social.incomeMonthlyEur != null ? `${Number(social.incomeMonthlyEur).toLocaleString('de-DE')} €/Mo.` : '—', sub: 'Nettoeinkommen je Person', color: '#16a34a' },
                      { icon: '👶', label: 'Kinderarmut', value: social.childPovertyPct != null ? `${Number(social.childPovertyPct).toFixed(1)} %` : '—', sub: 'Kinder in SGB-II-Haushalten', color: '#dc2626' },
                      { icon: '👴', label: 'Altersarmut', value: social.oldAgePovertyPct != null ? `${Number(social.oldAgePovertyPct).toFixed(1)} %` : '—', sub: 'Grundsicherung im Alter', color: '#d97706' },
                      { icon: '🚨', label: 'Straftaten', value: social.crimeRatePer100k != null ? `${Number(social.crimeRatePer100k).toFixed(1)} / 100.000` : '—', sub: 'Straftaten je 100.000 Einw.', color: '#7c3aed' },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Quelle: BBSR INKAR 2025 · {social.dataYear ?? '—'}</p>
                  </div>
                </>
              )}
            </div>
            {ags && <SimilarByMetric metric="income" currentAgs={ags} currentValue={social?.incomeMonthlyEur} label="Haushaltseinkommen" unit="€/Mon" />}
          </section>

          {/* ─── Bildung ──────────────────────────────────────────── */}
          <section id="bildung" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Bildung" source="BBSR INKAR 2025 · jährlich" note="INKAR 2025-Ausgabe — Datenjahr variiert je Indikator (i. d. R. 1–2 Jahre Verzug)" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {!education ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Daten noch nicht verfügbar</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 1, background: C.bgGrid }}>
                    {[
                      { icon: '🎓', label: 'Abiturquote', value: education.abiturRate != null ? `${Number(education.abiturRate).toFixed(1)} %` : '—', sub: 'Schulabgänger mit Abitur', color: '#2563eb' },
                      { icon: '⚠️', label: 'Abbruchquote', value: education.dropoutRate != null ? `${Number(education.dropoutRate).toFixed(1)} %` : '—', sub: 'Schulabgänger ohne Abschluss', color: '#dc2626' },
                      { icon: '📅', label: 'Datenjahr', value: education.dataYear != null ? String(education.dataYear) : '—', sub: 'Berichtsjahr', color: C.text3 },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Quelle: BBSR INKAR 2025 · {education.dataYear ?? '—'}</p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ─── Erreichbarkeit ───────────────────────────────────── */}
          <section id="erreichbarkeit" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Erreichbarkeit" source="BBSR INKAR 2025 · jährlich" note="INKAR 2025-Ausgabe — Datenjahr variiert je Indikator (i. d. R. 1–2 Jahre Verzug)" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {!accessibility ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Daten noch nicht verfügbar</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 1, background: C.bgGrid }}>
                    {[
                      { icon: '🛒', label: 'Supermarkt', value: accessibility.distSupermarketM != null ? `${accessibility.distSupermarketM.toLocaleString('de-DE')} m` : '—', sub: 'Ø Entfernung zum Supermarkt', color: '#16a34a' },
                      { icon: '💊', label: 'Apotheke', value: accessibility.distPharmacyM != null ? `${accessibility.distPharmacyM.toLocaleString('de-DE')} m` : '—', sub: 'Ø Entfernung zur Apotheke', color: '#dc2626' },
                      { icon: '🚌', label: 'ÖPNV-Haltestelle', value: accessibility.distTransitStopM != null ? `${accessibility.distTransitStopM.toLocaleString('de-DE')} m` : '—', sub: 'Ø Entfernung zur Haltestelle', color: '#2563eb' },
                      { icon: '📅', label: 'Datenjahr', value: accessibility.dataYear != null ? String(accessibility.dataYear) : '—', sub: 'Berichtsjahr', color: C.text3 },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Quelle: BBSR INKAR 2025 · {accessibility.dataYear ?? '—'}</p>
                  </div>
                </>
              )}
            </div>
          </section>
          </>)}

          {activeTab === 'energie' && (
          <section id="elektro" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="E-Mobilität" source="BBSR INKAR 2025 · jährlich" note="INKAR 2025-Ausgabe — Datenjahr variiert je Indikator (i. d. R. 1–2 Jahre Verzug)" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {!ev ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Daten noch nicht verfügbar</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 1, background: C.bgGrid }}>
                    {[
                      { icon: '⚡', label: 'E-Auto-Anteil', value: ev.evSharePct != null ? `${Number(ev.evSharePct).toFixed(2)} %` : '—', sub: 'Anteil Elektrofahrzeuge', color: '#16a34a' },
                      { icon: '🔌', label: 'Ladepunkte', value: ev.chargersPer10k != null ? `${Number(ev.chargersPer10k).toFixed(1)} / 10.000` : '—', sub: 'Öffentl. Ladepunkte je 10.000 EW', color: '#2563eb' },
                      { icon: '📅', label: 'Datenjahr', value: ev.dataYear != null ? String(ev.dataYear) : '—', sub: 'Berichtsjahr', color: C.text3 },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Quelle: BBSR INKAR 2025 · {ev.dataYear ?? '—'}</p>
                  </div>
                </>
              )}
            </div>
          </section>
          )}

          {activeTab === 'bevoelkerung' && (
          <section id="bevoelk3" style={{ marginBottom: 48, scrollMarginTop: 72 }}>
            <SectionHeader title="Bevölkerungsdynamik" source="BBSR INKAR 2025 · jährlich" note="INKAR 2025-Ausgabe — Datenjahr variiert je Indikator (i. d. R. 1–2 Jahre Verzug)" />
            <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
              {!populationDynamics ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Daten noch nicht verfügbar</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 1, background: C.bgGrid }}>
                    {[
                      { icon: '🎂', label: 'Durchschnittsalter', value: populationDynamics.avgAge != null ? `${Number(populationDynamics.avgAge).toFixed(1)} J.` : '—', sub: 'Mittleres Alter der Bevölkerung', color: '#7c3aed' },
                      { icon: '👴', label: 'Anteil 65+', value: populationDynamics.share65plus != null ? `${Number(populationDynamics.share65plus).toFixed(1)} %` : '—', sub: 'Bevölkerungsanteil 65 Jahre+', color: '#d97706' },
                      { icon: '➡️', label: 'Wanderungssaldo', value: populationDynamics.netMigrationPer1000 != null ? `${Number(populationDynamics.netMigrationPer1000).toFixed(1)} / 100.000` : '—', sub: 'Nettomigration je 1.000 Einw.', color: populationDynamics.netMigrationPer1000 != null && Number(populationDynamics.netMigrationPer1000) >= 0 ? '#16a34a' : '#dc2626' },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: '#e2e8f0', borderTop: '1px solid #e2e8f0' }}>
                    {[
                      { icon: '🧑', label: 'Jugendwanderung', value: populationDynamics.youthMigrationPer1000 != null ? `${Number(populationDynamics.youthMigrationPer1000).toFixed(1)} / 100.000` : '—', sub: 'Wanderung 18–25 Jahre je 1.000 EW', color: populationDynamics.youthMigrationPer1000 != null && Number(populationDynamics.youthMigrationPer1000) >= 0 ? '#16a34a' : '#dc2626' },
                      { icon: '📈', label: 'Prognose 2030', value: populationDynamics.popProjection2030Pct != null ? `${Number(populationDynamics.popProjection2030Pct) > 0 ? '+' : ''}${Number(populationDynamics.popProjection2030Pct).toFixed(1)} %` : '—', sub: 'Bevölkerungsveränderung 2022→2030', color: populationDynamics.popProjection2030Pct != null && Number(populationDynamics.popProjection2030Pct) >= 0 ? '#16a34a' : '#dc2626' },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bgCard, padding: '20px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.sub}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.text5, margin: 0 }}>Quelle: BBSR INKAR 2025 · {populationDynamics.dataYear ?? '—'}</p>
                  </div>
                </>
              )}
            </div>
          </section>
          )}

        </main>
      </div>
    </div>
  );
}
