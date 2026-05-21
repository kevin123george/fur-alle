import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { kreisAgsFromSlugs } from '../lib/kreis-slugs';
import { KreisSubLayout } from '../components/layout/KreisSubLayout';
import { useNews } from '../hooks/useNews';

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
  if (d < 60) return `vor ${d} Min.`;
  const h = Math.floor(d / 60);
  if (h < 24) return `vor ${h} Std.`;
  const days = Math.floor(h / 24);
  return `vor ${days} Tag${days !== 1 ? 'en' : ''}`;
}

function SkeletonCard() {
  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm p-5 flex flex-col gap-3">
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="flex gap-3 mt-auto pt-1">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    </div>
  );
}

export function KreisNachrichten() {
  const { stateSlug, kreisSlug, ags: agsParam } = useParams<{ stateSlug?: string; kreisSlug?: string; ags?: string }>();
  const ags = stateSlug && kreisSlug ? kreisAgsFromSlugs(stateSlug, kreisSlug) ?? agsParam : agsParam;

  const [districtName, setDistrictName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!ags) return;
    api.employment.byAgs(ags)
      .then(d => setDistrictName(d.districtName))
      .catch(() => setDistrictName(undefined));
  }, [ags]);

  const { data: news, loading } = useNews(ags, districtName);

  if (!ags) return null;

  return (
    <KreisSubLayout ags={ags} title="Nachrichten" source="Google News · alle 2 Stunden" activeSubpage="nachrichten">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-base-content tracking-tight leading-tight mb-1">
          Lokale Nachrichten
          {districtName && <span className="font-medium text-base-content/50"> — {districtName}</span>}
        </h1>
        <p className="text-sm text-base-content/50 leading-relaxed">
          Aktuelle Schlagzeilen aus der Region — aggregiert via Google News RSS
        </p>
      </div>

      {/* ── News card grid ─────────────────────────────────────── */}
      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : news.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-5xl">📰</span>
          <span className="text-base font-semibold text-base-content">Keine Nachrichten gefunden</span>
          <span className="text-sm text-base-content/40 max-w-sm leading-relaxed">
            Für „{districtName ?? ags}" wurden aktuell keine Nachrichten gefunden.
          </span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline"
              >
                <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 hover:-translate-y-0.5 transition-all duration-200 p-5 h-full flex flex-col gap-3 cursor-pointer">
                  {/* Dot + title */}
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    <span className="text-sm font-semibold text-base-content leading-snug flex-1">
                      {item.title}
                    </span>
                  </div>

                  {/* Source + date + external icon */}
                  <div className="flex items-center gap-2 mt-auto pt-1">
                    {item.source && (
                      <span className="text-xs font-medium text-base-content/50 truncate">
                        {item.source}
                      </span>
                    )}
                    {item.publishedAt && (
                      <span className="badge badge-ghost badge-xs shrink-0">
                        {timeAgo(item.publishedAt)}
                      </span>
                    )}
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="ml-auto shrink-0 text-base-content/25">
                      <path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <p className="text-[10px] text-base-content/25 mt-4">
            Quelle: Google News RSS · Ergebnisse für „{districtName ?? ags}" · alle 2 Stunden aktualisiert
          </p>
        </>
      )}

    </KreisSubLayout>
  );
}
