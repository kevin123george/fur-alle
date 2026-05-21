import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { kreisPath } from '../lib/kreis-slugs';
import { toBlob } from 'html-to-image';
import { BRAND } from '../lib/brand';
import { KreisShareCard } from '../components/cards/KreisShareCard';
import { useEmployment } from '../hooks/useEmployment';
import { useCluster } from '../hooks/useCluster';
import { useGdp } from '../hooks/useGdp';
import { useSocial } from '../hooks/useSocial';
import { useDemographics } from '../hooks/useDemographics';
import { useBroadband } from '../hooks/useBroadband';
import { useHousing } from '../hooks/useHousing';
import { useHealthcare } from '../hooks/useHealthcare';
import { useNatPop } from '../hooks/useNatPop';
import { useEmploymentExtended } from '../hooks/useEmploymentExtended';
import { useCommuters } from '../hooks/useCommuters';
import { useVehicles } from '../hooks/useVehicles';
import { useTransit } from '../hooks/useTransit';
import { getBundesland } from '../lib/bundeslaender';

type CardVariant = 'overview' | 'economy' | 'social' | 'cluster' | 'map' | 'population' | 'labor' | 'mobility';

const VARIANTS: { key: CardVariant; label: string; icon: string }[] = [
  { key: 'overview',    label: 'Überblick',    icon: '📊' },
  { key: 'economy',     label: 'Wirtschaft',   icon: '💰' },
  { key: 'social',      label: 'Soziales',     icon: '🤝' },
  { key: 'population',  label: 'Bevölkerung',  icon: '👥' },
  { key: 'labor',       label: 'Arbeitsmarkt', icon: '💼' },
  { key: 'mobility',    label: 'Mobilität',    icon: '🚗' },
  { key: 'cluster',     label: 'Kreistyp',     icon: '🤖' },
  { key: 'map',         label: 'Karte',        icon: '🗺️' },
];

export function SharePage() {
  const { ags } = useParams<{ ags: string }>();
  const cardRef = useRef<HTMLDivElement>(null);

  const [downloading, setDownloading] = useState(false);
  const [variant, setVariant] = useState<CardVariant>('overview');

  const { data: allEmployment } = useEmployment();
  const employment = allEmployment?.find(e => e.ags === ags) ?? null;
  const { data: cluster }            = useCluster(ags);
  const { data: gdp }                = useGdp(ags);
  const { data: social }             = useSocial(ags);
  const { data: demographics }       = useDemographics(ags);
  const { data: broadband }          = useBroadband(ags);
  const { data: housing }            = useHousing(ags);
  const { data: healthcare }         = useHealthcare(ags);
  const { data: natpop }             = useNatPop(ags);
  const { data: employmentExtended } = useEmploymentExtended(ags);
  const { data: commuters }          = useCommuters(ags);
  const { data: vehicles }           = useVehicles(ags);
  const { data: transit }            = useTransit(ags);
  const bundesland = ags ? getBundesland(ags) : '';

  async function download() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const el = cardRef.current;
      const blob = await toBlob(el, { pixelRatio: 2 });
      if (!blob) throw new Error('toBlob returned null');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${employment?.districtName ?? ags ?? 'kreis'}-${variant}-${BRAND.slug}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      data-theme="dark"
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-y-auto py-10 px-6"
      style={{
        background: ags
          ? `linear-gradient(rgba(3,7,18,0.75), rgba(3,7,18,0.75)), url(/posters/${ags}.png) center/cover no-repeat fixed`
          : 'linear-gradient(145deg, #050c1a 0%, #0a1628 100%)',
      }}
    >
      {/* Back */}
      <div className="fixed top-4 left-5 z-10">
        <Link to={ags ? kreisPath(ags) : '#'} className="btn btn-ghost btn-sm">← Zurück</Link>
      </div>

      {/* Header */}
      <div className="text-center mb-5">
        <div className="badge badge-outline badge-sm mb-2 opacity-40 tracking-widest uppercase text-[10px]">
          Share Card
        </div>
        <h1 className="text-2xl font-black tracking-tight text-base-content">
          {employment?.districtName ?? '…'}
        </h1>
      </div>

      {/* Variant selector */}
      <div className="flex flex-wrap gap-1.5 mb-5 max-w-lg justify-center">
        {VARIANTS.map(v => (
          <button
            key={v.key}
            onClick={() => setVariant(v.key)}
            className={`btn btn-sm ${variant === v.key ? 'btn-primary' : 'btn-ghost opacity-50'}`}
          >
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* Card — inline styles kept: rendered to canvas by html2canvas */}
      <div
        ref={cardRef}
        className="rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] inline-block leading-none"
        style={{ background: '#060d1f' }}
      >
        <KreisShareCard
          variant={variant}
          employment={employment}
          cluster={cluster}
          gdp={gdp}
          social={social}
          demographics={demographics}
          broadband={broadband}
          housing={housing}
          healthcare={healthcare}
          natpop={natpop}
          employmentExtended={employmentExtended}
          commuters={commuters}
          vehicles={vehicles}
          transit={transit}
          bundesland={bundesland}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button onClick={download} disabled={downloading} className="btn btn-primary gap-2">
          {downloading
            ? <span className="loading loading-spinner loading-xs" />
            : <span>⬇</span>}
          {downloading ? 'Wird erstellt…' : 'Als PNG laden'}
        </button>
        <Link to={ags ? kreisPath(ags) : '#'} className="btn btn-ghost">Details</Link>
      </div>

      <p className="mt-3 text-xs text-base-content/30 text-center">
        1080×1080 · Instagram-optimiert · {BRAND.name}
      </p>
    </div>
  );
}
