import { useLocation, Link } from 'react-router-dom';
import { ThemePicker } from './ThemePicker';
import { BRAND } from '../../lib/brand';

const PAGE_LABELS: Record<string, string> = {
  '/': 'Übersicht',
  '/impressum': 'Impressum',
  '/datenschutz': 'Datenschutzerklärung',
};

export function TopBar({ onOpenSearch, onToggleSidebar, sidebarExpanded }: {
  onOpenSearch?: () => void;
  onToggleSidebar?: () => void;
  sidebarExpanded?: boolean;
}) {
  const { pathname } = useLocation();
  const isKreis = pathname.startsWith('/kreis/');
  const label = PAGE_LABELS[pathname] ?? 'Übersicht';

  return (
    <header className="navbar bg-base-100 sticky top-0 z-30 border-b border-base-200 min-h-[52px] px-4 gap-2">

      {/* ── Left ─────────────────────────────────────────────────── */}
      <div className="navbar-start gap-2">
        {/* Mobile hamburger */}
        <label htmlFor="sidebar-toggle" className="btn btn-ghost btn-sm btn-square lg:hidden" aria-label="Open menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </label>

        {/* Desktop sidebar collapse toggle */}
        <button
          onClick={onToggleSidebar}
          className="btn btn-ghost btn-sm btn-square hidden lg:flex"
          aria-label="Toggle sidebar"
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-300 ${sidebarExpanded ? '' : 'rotate-180'}`}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          <Link to="/" className="text-base-content/40 font-medium hover:text-base-content/70 shrink-0 no-underline">
            {BRAND.name}
          </Link>
          {!isKreis && (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-base-content/25">
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-semibold text-primary truncate">{label}</span>
            </>
          )}
        </div>
      </div>

      {/* ── Center — search ──────────────────────────────────────── */}
      <div className="navbar-center hidden sm:flex w-[30%]">
        <button
          onClick={onOpenSearch}
          className="w-full btn btn-ghost btn-sm gap-2 border border-base-200 rounded-lg px-3 font-normal text-base-content/40 hover:text-base-content/70 justify-start"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M7 13A6 6 0 1 0 7 1a6 6 0 0 0 0 12ZM14 14l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="text-xs flex-1 text-left">Suche…</span>
          <kbd className="kbd kbd-xs shrink-0">⌘K</kbd>
        </button>
      </div>

      {/* ── Right ────────────────────────────────────────────────── */}
      <div className="navbar-end gap-2">

        {/* Theme picker */}
        <ThemePicker />

        {/* Live badge */}
        <div className="badge badge-success gap-1.5 badge-sm font-semibold">
          <span className="live-dot w-1.5 h-1.5 rounded-full bg-success-content/80 shrink-0" />
          LIVE
        </div>

        {/* GitHub */}
        <a href="https://github.com/kevin123george/fur-alle" target="_blank" rel="noopener noreferrer"
          className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-base-content/70">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"/>
          </svg>
        </a>
        {/* LinkedIn */}
        <a href="https://www.linkedin.com/in/kevin-george123/" target="_blank" rel="noopener noreferrer"
          className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-base-content/70">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
      </div>
    </header>
  );
}
