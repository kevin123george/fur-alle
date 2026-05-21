import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { kreisPath } from '../../lib/kreis-slugs';
import { BRAND } from '../../lib/brand';

interface KreisSubLayoutProps {
  ags: string;
  title: string;
  source?: string;
  activeSubpage?: 'stellen' | 'nachrichten';
  children: ReactNode;
}

export function KreisSubLayout({ ags, title, source, activeSubpage, children }: KreisSubLayoutProps) {
  const [kreisName, setKreisName] = useState<string>('…');

  useEffect(() => {
    api.employment.byAgs(ags)
      .then(d => setKreisName(d.districtName))
      .catch(() => setKreisName(`AGS ${ags}`));
  }, [ags]);

  return (
    <>
      {/* ── Sticky header + tab bar ─────────────────────────────── */}
      <div className="sticky top-[52px] z-[90] bg-base-100 border-b border-base-200">
        {/* Breadcrumb row */}
        <div className="max-w-[960px] mx-auto px-6">
          <div className="flex items-center justify-between h-11 gap-4">
            <nav className="flex items-center gap-1 text-xs text-base-content/40 min-w-0">
              <Link to="/" className="text-primary font-semibold shrink-0 no-underline hover:text-primary/70">
                {BRAND.name}
              </Link>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <Link to={kreisPath(ags)} className="text-base-content/50 font-medium no-underline hover:text-base-content/80 truncate max-w-[200px]">
                {kreisName}
              </Link>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-base-content font-semibold whitespace-nowrap">{title}</span>
              {source && (
                <span className="text-[10px] text-base-content/30 font-medium whitespace-nowrap shrink-0">
                  · {source}
                </span>
              )}
            </nav>
            <Link to={kreisPath(ags)} className="btn btn-xs btn-outline btn-primary shrink-0 no-underline">
              ← {kreisName}
            </Link>
          </div>
        </div>

        {/* Sub-page tab row */}
        <div className="max-w-[960px] mx-auto px-6 overflow-x-auto">
          <div role="tablist" className="tabs tabs-border tabs-sm">
            <Link to={kreisPath(ags)} role="tab"
              className={`tab text-[12px] whitespace-nowrap ${!activeSubpage ? 'tab-active font-semibold' : ''}`}>
              Übersicht
            </Link>
            <Link to={`${kreisPath(ags)}/stellen`} role="tab"
              className={`tab text-[12px] whitespace-nowrap ${activeSubpage === 'stellen' ? 'tab-active font-semibold' : ''}`}>
              Stellen
            </Link>
            <Link to={`${kreisPath(ags)}/nachrichten`} role="tab"
              className={`tab text-[12px] whitespace-nowrap ${activeSubpage === 'nachrichten' ? 'tab-active font-semibold' : ''}`}>
              Nachrichten
            </Link>
          </div>
        </div>
      </div>

      {/* ── Content area ────────────────────────────────────────── */}
      <div className="bg-base-200 min-h-[calc(100vh-96px)]">
        <div className="max-w-[960px] mx-auto px-6 py-7 pb-16">
          {children}
        </div>
      </div>
    </>
  );
}
