import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { EmploymentDTO } from '../../types/employment';
import { kreisPath } from '../../lib/kreis-slugs';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function KreisSearchModal({ open, onClose }: Props) {
  const [query, setQuery]       = useState('');
  const [kreise, setKreise]     = useState<EmploymentDTO[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef                = useRef<HTMLInputElement>(null);
  const navigate                = useNavigate();

  useEffect(() => {
    api.employment.all().then(setKreise).catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = query.trim()
    ? kreise.filter(k => k.districtName.toLowerCase().includes(query.toLowerCase()))
    : kreise.slice(0, 8);

  function go(ags: string) {
    navigate(kreisPath(ags));
    onClose();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) go(results[selected].ags);
    if (e.key === 'Escape') onClose();
  }

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 80,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520,
          margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: '#94a3b8' }}>
            <path d="M7 13A6 6 0 1 0 7 1a6 6 0 0 0 0 12ZM14 14l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={onKey}
            placeholder="Landkreis suchen…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 15, color: '#0f172a', background: 'transparent',
            }}
          />
          <kbd style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', borderRadius: 5, padding: '2px 7px' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              Kein Landkreis gefunden
            </div>
          ) : results.map((k, i) => (
            <div
              key={k.ags}
              onClick={() => go(k.ags)}
              onMouseEnter={() => setSelected(i)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 16px', cursor: 'pointer',
                background: i === selected ? '#eff6ff' : 'transparent',
                borderLeft: i === selected ? '2px solid #3b82f6' : '2px solid transparent',
              }}
            >
              <div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{k.districtName}</span>
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                {k.ags}
              </span>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 16 }}>
          {[['↑↓', 'navigieren'], ['↵', 'öffnen'], ['ESC', 'schließen']].map(([key, label]) => (
            <span key={key} style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: '#f1f5f9', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
