import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toBlob } from 'html-to-image';
import { HomeShareCard } from '../components/cards/HomeShareCard';
import type { HomeVariant } from '../components/cards/HomeShareCard';
import { useEmployment } from '../hooks/useEmployment';
import { useClusters } from '../hooks/useClusters';
import { useMapOverlay, OVERLAY_METRICS, type OverlayMetricKey } from '../hooks/useMapOverlay';
import { BRAND } from '../lib/brand';

const VARIANTS: { key: HomeVariant; label: string; icon: string }[] = [
  { key: 'overview',    label: 'Überblick',  icon: '◈' },
  { key: 'map_alq',     label: 'Karte ALQ',  icon: '◉' },
  { key: 'map_cluster', label: 'Kreistypen', icon: '⬡' },
  { key: 'map_overlay', label: 'Indikator',  icon: '◐' },
  { key: 'top10',       label: 'Ranking',    icon: '≡' },
];

export function HomeSharePage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [variant, setVariant] = useState<HomeVariant>('overview');
  const [overlayMetric, setOverlayMetric] = useState<OverlayMetricKey>('gdp');

  const { data: employmentRaw } = useEmployment();
  const employment = employmentRaw ?? [];
  const { data: clusters = [] } = useClusters();
  const { data: overlayData } = useMapOverlay(variant === 'map_overlay' ? overlayMetric : null);
  const overlayMeta = OVERLAY_METRICS.find(m => m.key === overlayMetric) ?? null;

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
      a.download = `deutschland-${variant === 'map_overlay' ? overlayMetric : variant}-${BRAND.slug}.png`;
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
      className="fixed inset-0 z-[999] flex flex-col items-center overflow-y-auto pb-12"
      style={{
        background: 'linear-gradient(rgba(2,6,15,0.72), rgba(2,6,15,0.72)), url(/posters/de.png) center/cover no-repeat fixed',
      }}
    >
      {/* Top bar */}
      <div className="w-full max-w-xl flex items-center justify-between px-2 py-5">
        <Link to="/" className="btn btn-ghost btn-sm">← Zurück</Link>
        <span className="text-[10px] font-bold text-base-content/20 tracking-widest uppercase">Share Cards</span>
        <div className="w-14" />
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-black tracking-tight text-base-content">Deutschland Übersicht</h1>
        <p className="mt-1.5 text-xs text-base-content/30 font-medium">
          Wähle eine Karte · lade als PNG herunter
        </p>
      </div>

      {/* Variant selector */}
      <div className="join flex-wrap justify-center mb-3">
        {VARIANTS.map(v => (
          <button
            key={v.key}
            onClick={() => setVariant(v.key)}
            className={`join-item btn btn-sm gap-1.5 ${variant === v.key ? 'btn-primary' : 'btn-ghost opacity-50'}`}
          >
            <span>{v.icon}</span>
            {v.label}
          </button>
        ))}
      </div>

      {/* Overlay metric selector */}
      {variant === 'map_overlay' && (
        <div className="join flex-wrap justify-center mb-4">
          {OVERLAY_METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setOverlayMetric(m.key as OverlayMetricKey)}
              className={`join-item btn btn-xs gap-1 ${overlayMetric === m.key ? 'btn-info' : 'btn-ghost opacity-50'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Card — inline styles kept: rendered to canvas by html2canvas */}
      <div
        ref={cardRef}
        className="rounded-3xl shadow-[0_48px_120px_rgba(0,0,0,0.75)] ring-1 ring-white/[0.04] inline-block leading-none"
        style={{ background: '#04080e' }}
      >
        <HomeShareCard
          variant={variant}
          employment={employment}
          clusters={clusters}
          overlayData={overlayData}
          overlayMeta={overlayMeta}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 mt-7 items-center">
        <button onClick={download} disabled={downloading} className="btn btn-primary gap-2">
          {downloading
            ? <span className="loading loading-spinner loading-xs" />
            : <span className="text-base">↓</span>}
          {downloading ? 'Wird erstellt…' : 'Als PNG speichern'}
        </button>
        <Link to="/" className="btn btn-ghost">Übersicht</Link>
      </div>

      <p className="mt-4 text-[10px] text-base-content/20 text-center font-medium">
        540 × 540 px · Instagram-optimiert · PNG-Export
      </p>
    </div>
  );
}
