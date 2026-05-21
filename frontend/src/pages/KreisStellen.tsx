import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { kreisAgsFromSlugs } from '../lib/kreis-slugs';
import { KreisSubLayout } from '../components/layout/KreisSubLayout';
import { useJobListings, DEFAULT_FILTERS, type JobFilters } from '../hooks/useJobListings';

function daysAgoLabel(dateStr: string): string {
  if (!dateStr) return '';
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (d === 0) return 'heute';
  if (d === 1) return 'gestern';
  return `vor ${d} T.`;
}

function SkeletonCard() {
  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm p-4 flex flex-col gap-3">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="flex gap-2 mt-auto">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    </div>
  );
}

export function KreisStellen() {
  const { stateSlug, kreisSlug, ags: agsParam } = useParams<{ stateSlug?: string; kreisSlug?: string; ags?: string }>();
  const ags = stateSlug && kreisSlug ? kreisAgsFromSlugs(stateSlug, kreisSlug) ?? agsParam : agsParam;

  const [districtName, setDistrictName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!ags) return;
    api.employment.byAgs(ags)
      .then(d => setDistrictName(d.districtName))
      .catch(() => setDistrictName(undefined));
  }, [ags]);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    setPage(1);
    setFilters(DEFAULT_FILTERS);
    setKeywordInput('');
  }, [ags]);

  const { jobs, total, loading, error } = useJobListings(districtName, page, filters);

  const hasMore     = total != null && jobs.length < total;
  const isFirstLoad = loading && page === 1 && jobs.length === 0;

  if (!ags) return null;

  return (
    <KreisSubLayout ags={ags} title="Stellenangebote" source="Bundesagentur für Arbeit · live" activeSubpage="stellen">

      {/* ── Page title ─────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-base-content tracking-tight leading-tight mb-1">
          Stellenangebote
          {districtName && <span className="font-medium text-base-content/50"> — {districtName}</span>}
        </h1>
        <p className="text-sm text-base-content/50 leading-relaxed">
          Aktuelle offene Stellen im Umkreis des Landkreises — direkt von der Bundesagentur für Arbeit
        </p>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────── */}
      <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200 p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">

          {/* Keyword search */}
          <form
            onSubmit={e => {
              e.preventDefault();
              setPage(1);
              setFilters(f => ({ ...f, keyword: keywordInput }));
            }}
            className="flex flex-1 min-w-40"
          >
            <input
              type="text"
              placeholder="Berufsbezeichnung…"
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              className="input input-sm input-bordered rounded-r-none flex-1 text-xs focus:outline-none focus:border-primary"
            />
            <button type="submit" className="btn btn-sm btn-primary rounded-l-none text-xs">
              Suche
            </button>
            {filters.keyword && (
              <button
                type="button"
                onClick={() => { setKeywordInput(''); setPage(1); setFilters(f => ({ ...f, keyword: '' })); }}
                className="btn btn-sm btn-ghost ml-1 text-xs"
              >
                ✕
              </button>
            )}
          </form>

          {/* Radius pills */}
          <div className="join">
            {(['10', '25', '50'] as const).map(r => (
              <button
                key={r}
                onClick={() => { setPage(1); setFilters(f => ({ ...f, radius: r })); }}
                className={`join-item btn btn-xs ${filters.radius === r ? 'btn-primary' : 'btn-ghost border border-base-200'}`}
              >
                {r} km
              </button>
            ))}
          </div>

          {/* Job type pills */}
          <div className="join">
            {([
              { value: '1', label: 'Arbeit' },
              { value: '2', label: 'Ausbildung' },
              { value: '4', label: 'Praktikum' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => { setPage(1); setFilters(f => ({ ...f, angebotsart: opt.value })); }}
                className={`join-item btn btn-xs ${filters.angebotsart === opt.value ? 'btn-primary' : 'btn-ghost border border-base-200'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {total != null && !loading && (
            <span className="text-xs text-base-content/40 tabular-nums ml-auto">
              {total.toLocaleString('de-DE')} Treffer
            </span>
          )}
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert-error mb-4 text-sm">
          Stellendaten konnten nicht geladen werden. Bitte erneut versuchen.
        </div>
      )}

      {/* ── Loading / empty states ─────────────────────────────── */}
      {!error && !districtName && !isFirstLoad && (
        <div className="text-center text-sm text-base-content/40 py-16">Kreisdaten werden geladen…</div>
      )}

      {!error && !isFirstLoad && districtName && jobs.length === 0 && !loading && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-5xl">📭</span>
          <span className="text-base font-semibold text-base-content">Keine Stellen gefunden</span>
          <span className="text-sm text-base-content/40 max-w-sm leading-relaxed">
            Für „{districtName}" wurden keine Treffer gefunden. Versuche, den Umkreis zu vergrößern oder die Suche zu leeren.
          </span>
        </div>
      )}

      {/* ── Job card grid ──────────────────────────────────────── */}
      {!error && (isFirstLoad || jobs.length > 0) && (
        <>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {isFirstLoad
              ? [...Array(9)].map((_, i) => <SkeletonCard key={i} />)
              : jobs.map(job => {
                  const url = job.externeUrl
                    ?? `https://www.arbeitsagentur.de/jobsuche/jobdetail/${btoa(job.refnr)}`;
                  const daysAgo = job.publishedDate ? daysAgoLabel(job.publishedDate) : '';
                  return (
                    <a
                      key={job.refnr}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline"
                    >
                      <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 hover:-translate-y-0.5 transition-all duration-200 p-4 h-full flex flex-col gap-2 cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-base-content leading-snug flex-1">
                            {job.titel}
                          </span>
                          {daysAgo && (
                            <span className="badge badge-ghost badge-xs shrink-0 mt-0.5">{daysAgo}</span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-primary leading-tight">
                          {job.arbeitgeber}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-1">
                          {job.ort && (
                            <span className="text-xs text-base-content/40">📍 {job.ort}</span>
                          )}
                          {job.beruf && job.beruf !== job.titel && (
                            <span className="badge badge-ghost badge-xs">{job.beruf}</span>
                          )}
                        </div>
                      </div>
                    </a>
                  );
                })
            }
          </div>

          {/* ── Pagination ─────────────────────────────────────── */}
          {jobs.length > 0 && (
            <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-base-200">
              <div>
                {hasMore ? (
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={loading}
                    className="btn btn-sm btn-outline btn-primary"
                  >
                    {loading
                      ? <><span className="loading loading-spinner loading-xs" /> Lädt…</>
                      : `Mehr laden (${jobs.length} von ${total!.toLocaleString('de-DE')})`}
                  </button>
                ) : (
                  <span className="text-xs text-base-content/40">
                    {jobs.length.toLocaleString('de-DE')} Stelle{jobs.length !== 1 ? 'n' : ''} geladen
                  </span>
                )}
              </div>
              <a
                href={`https://www.arbeitsagentur.de/jobsuche/suche?was=${encodeURIComponent(filters.keyword)}&wo=${encodeURIComponent((districtName ?? '').split(',')[0])}&umkreis=${filters.radius}&angebotsart=${filters.angebotsart}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-base-content/40 hover:text-base-content/70 no-underline transition-colors"
              >
                Alle auf arbeitsagentur.de →
              </a>
            </div>
          )}

          {/* Attribution */}
          <p className="text-[10px] text-base-content/25 mt-3">
            Quelle: Bundesagentur für Arbeit Jobbörse · Umkreis {filters.radius} km · live
          </p>
        </>
      )}

    </KreisSubLayout>
  );
}
