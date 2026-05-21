import { useEffect, useMemo, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { api, type SiteStats } from '../../lib/api';
import { useEmployment } from '../../hooks/useEmployment';
import { BL_META, codeToSlug } from '../../lib/bundeslaender';
import { kreisPath, kreisAgsFromSlugs } from '../../lib/kreis-slugs';
import { BRAND } from '../../lib/brand';

const BUNDESLAND_NAMES: Record<string, string> = {
  '01': 'Schleswig-Holstein', '02': 'Hamburg',        '03': 'Niedersachsen',
  '04': 'Bremen',             '05': 'Nordrhein-Westfalen', '06': 'Hessen',
  '07': 'Rheinland-Pfalz',   '08': 'Baden-Württemberg',   '09': 'Bayern',
  '10': 'Saarland',          '11': 'Berlin',          '12': 'Brandenburg',
  '13': 'Mecklenburg-Vorpommern', '14': 'Sachsen',    '15': 'Sachsen-Anhalt',
  '16': 'Thüringen',
};

const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/>
  </svg>
);
const IconRequest = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
  </svg>
);
const IconMap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4M9 7l6-3"/>
  </svg>
);
const IconBriefcase = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
  </svg>
);
const IconNewspaper = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a4 4 0 01-4-4V6"/>
    <path d="M10 7h6M10 11h6M10 15h4"/>
  </svg>
);
const IconDoc = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

/* ── Collapsed icon button ─────────────────────────────────────────── */
const iconBtn = (isActive: boolean) =>
  `flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-base-content/50 hover:bg-base-200 hover:text-base-content'
  }`;

function CItem({ tip, children }: { tip: string; children: React.ReactNode }) {
  return (
    <div className="tooltip tooltip-right flex justify-center w-full" data-tip={tip}>
      {children}
    </div>
  );
}

function CDivider() {
  return <div className="w-8 border-t border-base-200 my-1 mx-auto" />;
}

/* ── Expanded menu helpers ─────────────────────────────────────────── */
function SectionTitle({ label }: { label: string }) {
  return <li className="menu-title text-[10px] tracking-widest mt-3">{label}</li>;
}

const expandedItemCls = (isActive: boolean) =>
  `flex items-center gap-3 ${isActive ? 'active' : ''}`;

export function Sidebar({ expanded = true }: { onOpenSearch?: () => void; expanded?: boolean }) {
  const { pathname } = useLocation();
  const isKreis = pathname.startsWith('/kreis/');

  const activeAgs = isKreis
    ? (() => {
        const parts = pathname.split('/');
        if (parts.length >= 4) return kreisAgsFromSlugs(parts[2], parts[3]) ?? null;
        return parts[2] ?? null;
      })()
    : null;

  const [stats, setStats] = useState<SiteStats | null>(null);
  const [openBL, setOpenBL] = useState<Set<string>>(new Set());
  const { data: employment } = useEmployment();

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
    const id = setInterval(() => api.stats().then(setStats).catch(() => {}), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (activeAgs && activeAgs.length >= 2) {
      const code = activeAgs.slice(0, 2);
      setOpenBL(prev => prev.has(code) ? prev : new Set([...prev, code]));
    }
  }, [activeAgs]);

  const bundeslaender = useMemo(() => {
    if (!employment) return [];
    const map = new Map<string, { code: string; name: string; kreise: { ags: string; name: string }[] }>();
    for (const d of employment) {
      const code = d.ags.slice(0, 2);
      if (!map.has(code)) map.set(code, { code, name: BUNDESLAND_NAMES[code] ?? code, kreise: [] });
      map.get(code)!.kreise.push({ ags: d.ags, name: d.districtName });
    }
    return Array.from(map.values())
      .sort((a, b) => a.name.localeCompare(b.name, 'de'))
      .map(bl => ({ ...bl, kreise: bl.kreise.sort((a, b) => a.name.localeCompare(b.name, 'de')) }));
  }, [employment]);

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  function toggleBL(code: string) {
    setOpenBL(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  }

  return (
    <aside className={`bg-base-100 border-r border-base-200 flex flex-col min-h-screen transition-[width] duration-300 ease-in-out overflow-hidden ${expanded ? 'w-60' : 'w-[72px]'}`}>

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className={`flex items-center border-b border-base-200 min-h-[52px] shrink-0 ${expanded ? 'gap-2.5 px-3.5' : 'justify-center px-2'}`}>
        <Link to="/" className="flex items-center gap-2.5 no-underline min-w-0">
          <div className="w-8 h-8 rounded-lg shrink-0 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-base">
            🇩🇪
          </div>
          {expanded && (
            <span className="text-sm font-bold text-base-content whitespace-nowrap">
              {BRAND.name}
            </span>
          )}
        </Link>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">

        {expanded ? (
          /* ── Expanded: full labels ──────────────────────────── */
          <ul className="menu menu-sm p-2 gap-0.5">
            <SectionTitle label="Dashboard" />
            <li>
              <NavLink to="/" end className={({ isActive }) => expandedItemCls(isActive)}>
                <IconHome /><span>Übersicht</span>
              </NavLink>
            </li>
            <li>
              <a
                href="/#anfragen"
                onClick={e => { e.preventDefault(); document.getElementById('anfragen')?.scrollIntoView({ behavior: 'smooth' }); }}
                className={expandedItemCls(false)}
              >
                <IconRequest /><span>Landkreis anfragen</span>
              </a>
            </li>

            <SectionTitle label="Werkzeuge" />
            <li>
              <NavLink to="/bundeslaender" className={({ isActive }) => expandedItemCls(isActive)}>
                <IconMap /><span>Bundesländer</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/stellen" className={({ isActive }) => expandedItemCls(isActive)}>
                <IconBriefcase /><span>Stellensuche</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/nachrichten" className={({ isActive }) => expandedItemCls(isActive)}>
                <IconNewspaper /><span>Nachrichten</span>
              </NavLink>
            </li>

            <SectionTitle label="Bundesländer" />
            {bundeslaender.map(bl => (
              <li key={bl.code}>
                <details open={openBL.has(bl.code)}>
                  <summary onClick={e => { e.preventDefault(); toggleBL(bl.code); }} className="flex items-center gap-1.5">
                    {BL_META[bl.code]?.wappen && (
                      <img src={BL_META[bl.code].wappen} alt="" style={{ width: 12, height: 16, objectFit: 'contain', flexShrink: 0 }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <Link to={`/bundeslaender/${codeToSlug(bl.code)}`} onClick={e => e.stopPropagation()}
                      className="flex-1 text-[12px] font-semibold text-base-content no-underline hover:text-primary">
                      {bl.name}
                    </Link>
                    <span className="badge badge-ghost badge-xs shrink-0">{bl.kreise.length}</span>
                  </summary>
                  <ul>
                    {bl.kreise.map(k => (
                      <li key={k.ags}>
                        <Link to={kreisPath(k.ags)} className={`text-xs ${activeAgs === k.ags ? 'active' : ''}`}>
                          {k.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}

          </ul>

        ) : (
          /* ── Collapsed: icon-only buttons ───────────────────── */
          <div className="flex flex-col items-center gap-1 py-1">
            <CItem tip="Übersicht">
              <NavLink to="/" end className={({ isActive }) => iconBtn(isActive)}><IconHome /></NavLink>
            </CItem>
            <CItem tip="Landkreis anfragen">
              <a
                href="/#anfragen"
                onClick={e => { e.preventDefault(); document.getElementById('anfragen')?.scrollIntoView({ behavior: 'smooth' }); }}
                className={iconBtn(false)}
              ><IconRequest /></a>
            </CItem>

            <CDivider />

            <CItem tip="Bundesländer">
              <NavLink to="/bundeslaender" className={({ isActive }) => iconBtn(isActive)}><IconMap /></NavLink>
            </CItem>
            <CItem tip="Stellensuche">
              <NavLink to="/stellen" className={({ isActive }) => iconBtn(isActive)}><IconBriefcase /></NavLink>
            </CItem>
            <CItem tip="Nachrichten">
              <NavLink to="/nachrichten" className={({ isActive }) => iconBtn(isActive)}><IconNewspaper /></NavLink>
            </CItem>

          </div>
        )}
      </nav>

      {/* ── Legal links (pinned bottom, both modes) ──────────────── */}
      {expanded ? (
        <div className="border-t border-base-200 px-2 py-1 shrink-0">
          <ul className="menu menu-xs p-0 gap-0">
            <li>
              <NavLink to="/impressum" className={({ isActive }) => expandedItemCls(isActive)}>
                <IconDoc /><span>Impressum</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/datenschutz" className={({ isActive }) => expandedItemCls(isActive)}>
                <IconShield /><span>Datenschutz</span>
              </NavLink>
            </li>
          </ul>
        </div>
      ) : (
        <div className="border-t border-base-200 flex flex-col items-center gap-1 py-2 shrink-0">
          <CItem tip="Impressum">
            <NavLink to="/impressum" className={({ isActive }) => iconBtn(isActive)}><IconDoc /></NavLink>
          </CItem>
          <CItem tip="Datenschutz">
            <NavLink to="/datenschutz" className={({ isActive }) => iconBtn(isActive)}><IconShield /></NavLink>
          </CItem>
        </div>
      )}

      {/* ── Live status (expanded only) ───────────────────────────── */}
      {stats && expanded && (
        <div className="border-t border-base-200 p-3 shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-success shrink-0" />
            <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Live-Status</span>
          </div>
          <div className="grid grid-cols-2 gap-y-0.5 gap-x-3">
            {[
              { label: 'Energie',  value: fmt(stats.energyDataPoints) },
              { label: 'Kreise',   value: `${stats.kreisWithData}` },
              { label: 'Quellen',  value: `${stats.dataSources}` },
              { label: 'Anfragen', value: `${stats.totalRequests}` },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center">
                <span className="text-[11px] text-base-content/40">{r.label}</span>
                <span className="text-[11px] font-semibold tabular-nums text-base-content/70">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer (expanded only) ───────────────────────────────── */}
      {expanded && (
        <div className="border-t border-base-200 px-4 py-2.5 flex gap-4 shrink-0">
          <a href="https://github.com/kevin123george/fur-alle" target="_blank" rel="noopener noreferrer"
            className="text-xs text-base-content/30 hover:text-base-content/60 no-underline">GitHub</a>
          <a href="https://www.linkedin.com/in/kevin-george123/" target="_blank" rel="noopener noreferrer"
            className="text-xs text-base-content/30 hover:text-base-content/60 no-underline">LinkedIn</a>
          <a href="https://www.govdata.de/dl-de/by-2-0" target="_blank" rel="noopener noreferrer"
            className="text-xs text-base-content/30 hover:text-base-content/60 no-underline">Lizenz</a>
        </div>
      )}

  </aside>
  );
}
