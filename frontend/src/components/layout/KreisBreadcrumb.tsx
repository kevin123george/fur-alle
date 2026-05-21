import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { getBundesland, AGS_TO_BUNDESLAND } from '../../lib/bundeslaender';
import type { EmploymentDTO } from '../../types/employment';
import { kreisPath, kreisAgsFromSlugs } from '../../lib/kreis-slugs';

type DropdownKind = 'bl' | 'kreis' | null;

export function KreisBreadcrumb() {
  const { stateSlug, kreisSlug, ags: agsParam } = useParams<{ stateSlug?: string; kreisSlug?: string; ags?: string }>();
  const ags = stateSlug && kreisSlug ? (kreisAgsFromSlugs(stateSlug, kreisSlug) ?? agsParam) : agsParam;
  const navigate   = useNavigate();
  const [kreise, setKreise]     = useState<EmploymentDTO[]>([]);
  const [open, setOpen]         = useState<DropdownKind>(null);
  const [blSearch, setBlSearch] = useState('');
  const [kSearch, setKSearch]   = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.employment.all().then(setKreise).catch(() => {});
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(null); setBlSearch(''); setKSearch('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = useCallback((kind: DropdownKind) => {
    setOpen(o => o === kind ? null : kind);
    setBlSearch(''); setKSearch('');
  }, []);

  if (!ags) return null;

  const bundesland   = getBundesland(ags);
  const blPrefix     = ags.slice(0, 2);
  const kreisName    = kreise.find(k => k.ags === ags)?.districtName ?? '…';
  const kreiseInBl   = kreise
    .filter(k => k.ags.startsWith(blPrefix))
    .sort((a, b) => a.districtName.localeCompare(b.districtName, 'de'));
  const bundeslaender = Object.entries(AGS_TO_BUNDESLAND)
    .sort((a, b) => a[1].localeCompare(b[1], 'de'));

  const filteredBl    = bundeslaender.filter(([, name]) => name.toLowerCase().includes(blSearch.toLowerCase()));
  const filteredKreis = kreiseInBl.filter(k => k.districtName.toLowerCase().includes(kSearch.toLowerCase()));

  function goToBl(prefix: string) {
    const first = kreise
      .filter(k => k.ags.startsWith(prefix))
      .sort((a, b) => a.districtName.localeCompare(b.districtName, 'de'))[0];
    if (first) navigate(kreisPath(first.ags));
    setOpen(null);
  }

  function goToKreis(targetAgs: string) {
    navigate(kreisPath(targetAgs));
    setOpen(null);
  }

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
    background: '#fff', border: '1px solid #e2e8f0',
    borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    minWidth: 220, overflow: 'hidden',
  };

  const searchStyle: React.CSSProperties = {
    width: '100%', border: 'none', borderBottom: '1px solid #f1f5f9',
    padding: '8px 12px', fontSize: 12, outline: 'none',
    background: '#f8fafc', boxSizing: 'border-box',
  };

  const itemStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 12px', fontSize: 12, cursor: 'pointer',
    background: active ? '#eff6ff' : 'transparent',
    color: active ? '#2563eb' : '#0f172a',
    fontWeight: active ? 600 : 400,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  });

  const chevron = (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
      <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, minWidth: 0 }}>
      {/* Home */}
      <a
        href="/"
        onClick={e => { e.preventDefault(); navigate('/'); }}
        style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}
      >
        🇩🇪
      </a>

      <span style={{ color: '#cbd5e1', flexShrink: 0 }}>›</span>

      {/* Bundesland dropdown */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => toggle('bl')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: open === 'bl' ? '#eff6ff' : 'transparent',
            border: '1px solid ' + (open === 'bl' ? '#bfdbfe' : 'transparent'),
            borderRadius: 6, padding: '3px 7px', cursor: 'pointer',
            fontSize: 13, color: '#475569', fontWeight: 500,
          }}
        >
          {bundesland}
          {chevron}
        </button>
        {open === 'bl' && (
          <div style={dropdownStyle}>
            <input
              autoFocus
              placeholder="Bundesland suchen…"
              value={blSearch}
              onChange={e => setBlSearch(e.target.value)}
              style={searchStyle}
            />
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {filteredBl.map(([prefix, name]) => (
                <div
                  key={prefix}
                  style={itemStyle(prefix === blPrefix)}
                  onClick={() => goToBl(prefix)}
                  onMouseEnter={e => { if (prefix !== blPrefix) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (prefix !== blPrefix) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {name}
                  {prefix === blPrefix && <span style={{ fontSize: 10 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <span style={{ color: '#cbd5e1', flexShrink: 0 }}>›</span>

      {/* Kreis dropdown */}
      <div style={{ position: 'relative', minWidth: 0 }}>
        <button
          onClick={() => toggle('kreis')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: open === 'kreis' ? '#eff6ff' : 'transparent',
            border: '1px solid ' + (open === 'kreis' ? '#bfdbfe' : 'transparent'),
            borderRadius: 6, padding: '3px 7px', cursor: 'pointer',
            fontSize: 13, color: '#2563eb', fontWeight: 600,
            maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {kreisName}
          </span>
          {chevron}
        </button>
        {open === 'kreis' && (
          <div style={{ ...dropdownStyle, minWidth: 240 }}>
            <input
              autoFocus
              placeholder={`${kreiseInBl.length} Kreise in ${bundesland}…`}
              value={kSearch}
              onChange={e => setKSearch(e.target.value)}
              style={searchStyle}
            />
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {filteredKreis.map(k => (
                <div
                  key={k.ags}
                  style={itemStyle(k.ags === ags)}
                  onClick={() => goToKreis(k.ags)}
                  onMouseEnter={e => { if (k.ags !== ags) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (k.ags !== ags) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {k.districtName}
                  {k.ags === ags && <span style={{ fontSize: 10 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
