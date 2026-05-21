import { useState } from 'react';
import { useNews } from '../hooks/useNews';

// ags: unique 5-digit placeholder per Bundesland so the backend cache never collides
// (real Kreis AGS are 5 digits and never end in 000, so these are safe to use)
const BUNDESLAENDER = [
  { ags: '00000', name: 'Deutschland',           query: 'Deutschland' },
  { ags: '01000', name: 'Schleswig-Holstein',    query: 'Schleswig-Holstein' },
  { ags: '02000', name: 'Hamburg',               query: 'Hamburg' },
  { ags: '03000', name: 'Niedersachsen',         query: 'Niedersachsen' },
  { ags: '04000', name: 'Bremen',                query: 'Bremen' },
  { ags: '05000', name: 'Nordrhein-Westfalen',   query: 'Nordrhein-Westfalen' },
  { ags: '06000', name: 'Hessen',                query: 'Hessen' },
  { ags: '07000', name: 'Rheinland-Pfalz',       query: 'Rheinland-Pfalz' },
  { ags: '08000', name: 'Baden-Württemberg',     query: 'Baden-Württemberg' },
  { ags: '09000', name: 'Bayern',                query: 'Bayern' },
  { ags: '10000', name: 'Saarland',              query: 'Saarland' },
  { ags: '11000', name: 'Berlin',                query: 'Berlin' },
  { ags: '12000', name: 'Brandenburg',           query: 'Brandenburg' },
  { ags: '13000', name: 'Mecklenburg-Vorpommern', query: 'Mecklenburg-Vorpommern' },
  { ags: '14000', name: 'Sachsen',               query: 'Sachsen' },
  { ags: '15000', name: 'Sachsen-Anhalt',        query: 'Sachsen-Anhalt' },
  { ags: '16000', name: 'Thüringen',             query: 'Thüringen' },
];

const TOPICS = [
  { key: '',           label: 'Alle Themen' },
  { key: 'Politik',   label: 'Politik' },
  { key: 'Wirtschaft', label: 'Wirtschaft' },
  { key: 'Umwelt',    label: 'Umwelt' },
  { key: 'Soziales',  label: 'Soziales' },
];

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

export function NachrichtenPage() {
  const [selectedBL, setSelectedBL] = useState(BUNDESLAENDER[0]);
  const [topic, setTopic] = useState('');

  const query = topic ? `${selectedBL.query} ${topic}` : selectedBL.query;
  // Encode state + topic into the AGS cache key so every combination gets its own backend cache entry
  const cacheAgs = topic ? `${selectedBL.ags}t${topic.toLowerCase()}` : selectedBL.ags;
  const { data: news, loading } = useNews(cacheAgs, query);

  // Backend already filters by topic via the search query — no client-side filter needed
  const filtered = news;

  return (
    <div className="bg-base-200 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-base-content tracking-tight mb-1">
            Nachrichten
          </h1>
          <p className="text-sm text-base-content/50">
            Aktuelle Schlagzeilen aus Deutschland — aggregiert via Google News
          </p>
        </div>

        {/* ── Filters ────────────────────────────────────────────── */}
        <div className="card bg-base-100 border border-base-200 shadow-sm p-4 mb-6 flex flex-col gap-3">
          {/* Bundesland filter */}
          <div className="flex flex-wrap gap-1.5">
            {BUNDESLAENDER.map(bl => (
              <button
                key={bl.ags}
                onClick={() => setSelectedBL(bl)}
                className={`btn btn-xs ${selectedBL.ags === bl.ags ? 'btn-primary' : 'btn-ghost border border-base-200'}`}
              >
                {bl.name}
              </button>
            ))}
          </div>
          {/* Topic filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-base-content/40 uppercase tracking-widest">Thema:</span>
            <div className="join">
              {TOPICS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTopic(t.key)}
                  className={`join-item btn btn-xs ${topic === t.key ? 'btn-primary' : 'btn-ghost border border-base-200'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {filtered.length > 0 && (
              <span className="text-xs text-base-content/40 ml-auto tabular-nums">
                {filtered.length} Artikel
              </span>
            )}
          </div>
        </div>

        {/* ── Card grid ──────────────────────────────────────────── */}
        {loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <span className="text-5xl">📰</span>
            <span className="text-base font-semibold text-base-content">Keine Nachrichten gefunden</span>
            <span className="text-sm text-base-content/40">
              Für „{query}" wurden aktuell keine Artikel gefunden.
            </span>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="no-underline">
                <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 hover:-translate-y-0.5 transition-all duration-200 p-5 h-full flex flex-col gap-3 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    <span className="text-sm font-semibold text-base-content leading-snug flex-1">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-auto pt-1">
                    {item.source && (
                      <span className="text-xs font-medium text-base-content/50 truncate">{item.source}</span>
                    )}
                    {item.publishedAt && (
                      <span className="badge badge-ghost badge-xs shrink-0">{timeAgo(item.publishedAt)}</span>
                    )}
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="ml-auto shrink-0 text-base-content/25">
                      <path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        <p className="text-[10px] text-base-content/25 mt-6">
          Quelle: Google News RSS · Region: {selectedBL.name} · alle 2 Stunden aktualisiert
        </p>
      </div>
    </div>
  );
}
