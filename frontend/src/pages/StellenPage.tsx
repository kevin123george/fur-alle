import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useJobListings, DEFAULT_FILTERS, type JobFilters } from '../hooks/useJobListings';
import { BRAND } from '../lib/brand';

const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
  'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
  'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
];

function daysAgoLabel(dateStr: string): string {
  if (!dateStr) return '';
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (d === 0) return 'heute';
  if (d === 1) return 'gestern';
  if (d < 7) return `vor ${d} Tagen`;
  if (d < 14) return 'vor 1 Woche';
  return `vor ${Math.floor(d / 7)} Wochen`;
}

const ARBEITSZEIT_BADGE: Record<string, string> = {
  'Vollzeit': 'badge-info',
  'Teilzeit': 'badge-success',
  'Heimarbeit/Fernarbeit': 'badge-secondary',
  'Minijob': 'badge-warning',
  'Schicht/Nacht/Wochenende': 'badge-error',
};
const ARBEITSZEIT_LABEL: Record<string, string> = {
  'Heimarbeit/Fernarbeit': 'Homeoffice',
  'Schicht/Nacht/Wochenende': 'Schicht',
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-cyan-500',
  'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-teal-500',
];
function avatarColorClass(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function SkeletonCard() {
  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm p-5">
      <div className="flex gap-3 mb-4">
        <div className="skeleton w-11 h-11 rounded-xl shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function StellenPage() {
  const [searchParams] = useSearchParams();

  const [locationInput, setLocationInput] = useState('');
  const [wasInput, setWasInput] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [submittedLocation, setSubmittedLocation] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const locationRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const wo  = searchParams.get('wo')  ?? '';
    const was = searchParams.get('was') ?? '';
    if (wo) {
      setLocationInput(wo);
      setWasInput(was);
      setFilters(f => ({ ...f, keyword: was }));
      setSubmittedLocation(wo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { jobs, total, loading, error } = useJobListings(submittedLocation, page, filters);

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setFilters(f => ({ ...f, keyword: wasInput.trim() }));
    setSubmittedLocation(locationInput.trim() || selectedState || undefined);
    setPage(1);
  }

  function handleStateSelect(state: string) {
    const next = selectedState === state ? '' : state;
    setSelectedState(next);
    setLocationInput('');
    setFilters(f => ({ ...f, keyword: wasInput.trim() }));
    setSubmittedLocation(next || undefined);
    setPage(1);
  }

  function handleFilterChange<K extends keyof JobFilters>(key: K, val: JobFilters[K]) {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  }

  const hasMore   = total != null && jobs.length < total;
  const isLoading = loading && page === 1;

  return (
    <>
      {/* ── Hero / Search ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-b border-primary/20">
        <div className="max-w-[900px] mx-auto px-6 py-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-base-content/40 mb-5">
            <Link to="/" className="text-primary font-semibold no-underline hover:text-primary/70">{BRAND.name}</Link>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-base-content font-semibold">Stellenangebote</span>
          </nav>

          <h1 className="text-3xl font-extrabold text-base-content tracking-tight mb-1">Stellenangebote</h1>
          <p className="text-sm text-base-content/50 mb-6">
            Aktuelle Jobangebote aus ganz Deutschland — Bundesagentur für Arbeit
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Was</label>
                <input
                  type="text"
                  placeholder="Berufsbezeichnung, z.B. Ingenieur"
                  value={wasInput}
                  onChange={e => setWasInput(e.target.value)}
                  className="input input-bordered input-sm bg-base-100 focus:border-primary focus:outline-none text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Wo</label>
                <input
                  ref={locationRef}
                  type="text"
                  placeholder="Ort oder Landkreis — leer für Deutschland"
                  value={locationInput}
                  onChange={e => { setLocationInput(e.target.value); if (e.target.value) setSelectedState(''); }}
                  className="input input-bordered input-sm bg-base-100 focus:border-primary focus:outline-none text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-transparent uppercase tracking-widest select-none">‌</label>
                <button type="submit" className="btn btn-primary btn-sm">Suchen</button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap gap-3 items-center">
                <FilterGroup label="Art">
                  {(['1','2','4'] as const).map((v, i) => (
                    <button key={v} type="button"
                      onClick={() => handleFilterChange('angebotsart', v)}
                      className={`join-item btn btn-xs ${filters.angebotsart === v ? 'btn-primary' : 'btn-ghost border border-base-300'}`}>
                      {['Arbeit','Ausbildung','Praktikum'][i]}
                    </button>
                  ))}
                </FilterGroup>

                <FilterGroup label="Zeit">
                  {([['','Alle'],['vz','Vollzeit'],['tz','Teilzeit'],['ho','Homeoffice'],['mj','Minijob']] as const).map(([v,l]) => (
                    <button key={v} type="button"
                      onClick={() => handleFilterChange('arbeitszeit', v)}
                      className={`join-item btn btn-xs ${filters.arbeitszeit === v ? 'btn-primary' : 'btn-ghost border border-base-300'}`}>
                      {l}
                    </button>
                  ))}
                </FilterGroup>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <FilterGroup label="Umkreis">
                  {(['10','25','50','100'] as const).map(r => (
                    <button key={r} type="button"
                      onClick={() => handleFilterChange('radius', r)}
                      className={`join-item btn btn-xs ${filters.radius === r ? 'btn-primary' : 'btn-ghost border border-base-300'}`}>
                      {r} km
                    </button>
                  ))}
                </FilterGroup>

                <FilterGroup label="Datum">
                  {([['','Alle'],['1','Heute'],['7','Woche'],['30','Monat']] as const).map(([v,l]) => (
                    <button key={v} type="button"
                      onClick={() => handleFilterChange('veroeffentlichtseit', v)}
                      className={`join-item btn btn-xs ${filters.veroeffentlichtseit === v ? 'btn-primary' : 'btn-ghost border border-base-300'}`}>
                      {l}
                    </button>
                  ))}
                </FilterGroup>

                <FilterGroup label="Sortierung" className="ml-auto">
                  {([['1','Relevanz'],['4','Neueste']] as const).map(([v,l]) => (
                    <button key={v} type="button"
                      onClick={() => handleFilterChange('sort', v)}
                      className={`join-item btn btn-xs ${filters.sort === v ? 'btn-primary' : 'btn-ghost border border-base-300'}`}>
                      {l}
                    </button>
                  ))}
                </FilterGroup>
              </div>

              {/* Bundesland pills */}
              <div className="flex flex-wrap gap-1.5 items-center pt-1">
                <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest shrink-0">Bundesland</span>
                {BUNDESLAENDER.map(bl => (
                  <button key={bl} type="button" onClick={() => handleStateSelect(bl)}
                    className={`btn btn-xs rounded-full ${selectedState === bl ? 'btn-primary' : 'btn-ghost border border-base-300'}`}>
                    {bl}
                  </button>
                ))}
                {selectedState && (
                  <button type="button" onClick={() => handleStateSelect('')}
                    className="btn btn-xs btn-ghost border border-base-300 rounded-full">
                    ✕ Zurücksetzen
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────── */}
      <div className="bg-base-200 min-h-screen">
        <div className="max-w-[900px] mx-auto px-6 py-5 pb-16">

          {/* Result count */}
          {!isLoading && total != null && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-base-content/50 tabular-nums">
                <strong className="text-base-content">{total.toLocaleString('de-DE')}</strong> Stellen
                {submittedLocation ? ` in ${submittedLocation}` : ' in Deutschland'}
              </span>
              <a
                href={`https://www.arbeitsagentur.de/jobsuche/suche?was=${encodeURIComponent(filters.keyword)}&wo=${encodeURIComponent(submittedLocation ?? '')}&umkreis=${filters.radius}&angebotsart=${filters.angebotsart}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary font-semibold no-underline hover:underline"
              >
                Alle auf arbeitsagentur.de →
              </a>
            </div>
          )}

          {/* Error */}
          {error && <div className="alert alert-error mb-4 text-sm">Stellendaten konnten nicht geladen werden.</div>}

          {/* Skeleton */}
          {isLoading && !error && (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && jobs.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <span className="text-5xl">📭</span>
              <span className="text-base font-semibold text-base-content">Keine Stellen gefunden</span>
              <span className="text-sm text-base-content/40 max-w-sm leading-relaxed">
                Versuche einen anderen Ort, weiteren Umkreis oder andere Filter.
              </span>
            </div>
          )}

          {/* Job cards */}
          {!isLoading && jobs.length > 0 && (
            <>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mb-5">
                {jobs.map(job => {
                  const url = job.externeUrl
                    ?? `https://www.arbeitsagentur.de/jobsuche/jobdetail/${btoa(job.refnr)}`;
                  const daysAgo = job.publishedDate ? daysAgoLabel(job.publishedDate) : '';
                  const initials = job.arbeitgeber.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
                  const avatarCls = avatarColorClass(job.arbeitgeber);
                  const azBadge = job.arbeitszeit ? ARBEITSZEIT_BADGE[job.arbeitszeit] : null;
                  const azLabel = job.arbeitszeit ? (ARBEITSZEIT_LABEL[job.arbeitszeit] ?? job.arbeitszeit) : null;
                  return (
                    <a key={job.refnr} href={url} target="_blank" rel="noopener noreferrer" className="no-underline">
                      <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 hover:-translate-y-0.5 transition-all duration-200 p-5 h-full flex flex-col gap-3 cursor-pointer">
                        {/* Header: avatar + title + date */}
                        <div className="flex gap-3">
                          <div className={`w-11 h-11 rounded-xl shrink-0 ${avatarCls} flex items-center justify-center text-white text-sm font-black`}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-base-content leading-snug line-clamp-2 mb-0.5">
                              {job.titel}
                            </div>
                            <div className="text-xs font-semibold text-primary truncate">
                              {job.arbeitgeber}
                            </div>
                          </div>
                          {daysAgo && (
                            <span className="badge badge-ghost badge-xs shrink-0 self-start mt-0.5">{daysAgo}</span>
                          )}
                        </div>

                        {/* Footer: location + badges */}
                        <div className="flex flex-wrap gap-1.5 items-center mt-auto">
                          {job.ort && (
                            <span className="text-xs text-base-content/40 flex items-center gap-1">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                                <circle cx="12" cy="9" r="2.5"/>
                              </svg>
                              {job.ort}
                            </span>
                          )}
                          {azBadge && azLabel && (
                            <span className={`badge badge-xs ${azBadge}`}>{azLabel}</span>
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

              {/* Pagination */}
              <div className="flex items-center justify-between">
                {hasMore ? (
                  <button onClick={() => setPage(p => p + 1)} disabled={loading} className="btn btn-outline btn-primary btn-sm">
                    {loading
                      ? <><span className="loading loading-spinner loading-xs" /> Lädt…</>
                      : `Mehr laden (${jobs.length} von ${total!.toLocaleString('de-DE')})`}
                  </button>
                ) : (
                  <span className="text-xs text-base-content/40">
                    {jobs.length.toLocaleString('de-DE')} Stelle{jobs.length !== 1 ? 'n' : ''} geladen
                  </span>
                )}
                <span className="text-[10px] text-base-content/25">Quelle: Bundesagentur für Arbeit · live</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function FilterGroup({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest shrink-0">{label}</span>
      <div className="join">{children}</div>
    </div>
  );
}
