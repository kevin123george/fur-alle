import { useEffect, useState } from 'react';
import { api, type KreisRequest } from '../../lib/api';
import { BUNDESLAENDER, getBundesland } from '../../lib/bundeslaender';

interface GeoKreis {
  ags: string;
  name: string;
  bundesland: string;
}

function loadGeoKreise(): Promise<GeoKreis[]> {
  return fetch('/kreise.geo.json')
    .then(r => r.json())
    .then(geo => {
      return (geo.features as any[]).map((f: any) => {
        const raw = f.properties?.krs_code;
        const ags = (Array.isArray(raw) ? raw[0] : raw) ?? '';
        const name = f.properties?.krs_name ?? f.properties?.GEN ?? '';
        return { ags, name, bundesland: getBundesland(ags) };
      }).filter((k: GeoKreis) => k.ags && k.name);
    });
}

export function RequestSection({ embedded = false }: { embedded?: boolean }) {
  const [topRequests, setTopRequests] = useState<KreisRequest[]>([]);
  const [allKreise, setAllKreise] = useState<GeoKreis[]>([]);
  const [selectedBundesland, setSelectedBundesland] = useState('');
  const [selectedKreis, setSelectedKreis] = useState<GeoKreis | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const votedKey = 'regiohub_voted';

  useEffect(() => {
    api.requests.top().then(setTopRequests).catch(() => null);
    loadGeoKreise().then(setAllKreise).catch(() => null);
  }, []);

  const filteredKreise = allKreise
    .filter(k => k.bundesland === selectedBundesland)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  const handleSubmit = async () => {
    if (!selectedKreis || loading) return;
    setLoading(true);
    try {
      const result = await api.requests.submit(selectedKreis.ags, selectedKreis.name, selectedKreis.bundesland);
      const voted = JSON.parse(localStorage.getItem(votedKey) ?? '[]') as string[];
      localStorage.setItem(votedKey, JSON.stringify([...voted, selectedKreis.ags]));
      setTopRequests(prev => {
        const existing = prev.find(r => r.ags === result.ags);
        if (existing) return prev.map(r => r.ags === result.ags ? result : r).sort((a, b) => b.requestCount - a.requestCount);
        return [...prev, result].sort((a, b) => b.requestCount - a.requestCount).slice(0, 10);
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      // silently fail
    }
    setLoading(false);
  };

  const innerPadding = embedded ? '20px 24px' : '64px 24px';
  const gridStyle = embedded
    ? {}
    : { maxWidth: 1100, margin: '0 auto' };

  const inner = (
    <div className="request-grid" style={gridStyle}>

        {/* Left — form */}
        <div>
          <span style={{
            display: 'inline-block',
            background: '#FFFBEB', color: '#D97706',
            borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700,
            marginBottom: 12,
          }}>
            🗳️ STIMM MIT AB
          </span>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
            Welcher Landkreis soll als nächstes kommen?
          </h2>
          <p style={{ color: '#6B6B6B', fontSize: 14, margin: '0 0 28px', lineHeight: 1.6 }}>
            Wir priorisieren Landkreise nach Anfragen. Je mehr Stimmen, desto schneller.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>
                BUNDESLAND
              </label>
              <select
                value={selectedBundesland}
                onChange={e => { setSelectedBundesland(e.target.value); setSelectedKreis(null); }}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1.5px solid #E8E8E4', fontSize: 14, background: '#fff',
                  color: selectedBundesland ? '#1A1A1A' : '#9B9B9B',
                  appearance: 'none', cursor: 'pointer', outline: 'none',
                  fontFamily: 'inherit',
                }}
              >
                <option value="">Bundesland wählen…</option>
                {BUNDESLAENDER.map(bl => <option key={bl} value={bl}>{bl}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>
                LANDKREIS
              </label>
              <select
                value={selectedKreis?.ags ?? ''}
                onChange={e => {
                  const k = filteredKreise.find(k => k.ags === e.target.value) ?? null;
                  setSelectedKreis(k);
                }}
                disabled={!selectedBundesland}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1.5px solid #E8E8E4', fontSize: 14, background: '#fff',
                  color: selectedKreis ? '#1A1A1A' : '#9B9B9B',
                  appearance: 'none', cursor: selectedBundesland ? 'pointer' : 'not-allowed',
                  opacity: selectedBundesland ? 1 : 0.5, outline: 'none', fontFamily: 'inherit',
                }}
              >
                <option value="">Landkreis wählen…</option>
                {filteredKreise.map(k => <option key={k.ags} value={k.ags}>{k.name}</option>)}
              </select>
            </div>

            {topRequests[0] && (
              <div style={{
                background: '#FEF3C7', borderRadius: 8, padding: '10px 14px',
                fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                🔥 Meistgewünscht: <strong>{topRequests[0].districtName}</strong>, {topRequests[0].state} ({topRequests[0].requestCount} Anfragen)
              </div>
            )}

            {submitted ? (
              <div style={{
                background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8,
                padding: '12px 16px', fontSize: 13, color: '#065F46', fontWeight: 600,
              }}>
                ✅ Anfrage eingereicht! Wir priorisieren {selectedKreis?.name}.
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!selectedKreis || loading}
                style={{
                  padding: '12px 20px', borderRadius: 8, border: 'none',
                  background: selectedKreis ? '#2563EB' : '#E8E8E4',
                  color: selectedKreis ? '#fff' : '#9B9B9B',
                  fontSize: 14, fontWeight: 700, cursor: selectedKreis ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s', fontFamily: 'inherit',
                }}
              >
                {loading ? 'Wird gesendet…' : '🗳️ Landkreis anfragen'}
              </button>
            )}
          </div>
        </div>

        {/* Right — top requests leaderboard */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px' }}>
            Top-Anfragen
          </h3>
          {topRequests.length === 0 ? (
            <div style={{ color: '#9B9B9B', fontSize: 13 }}>Noch keine Anfragen — sei der Erste!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topRequests.map((r, i) => (
                <div key={r.ags} style={{
                  background: '#fff', border: '1px solid #E8E8E4', borderRadius: 10,
                  padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: i === 0 ? '#FEF3C7' : i === 1 ? '#F1F5F9' : '#FAFAF8',
                    border: `2px solid ${i === 0 ? '#F59E0B' : '#E8E8E4'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: i === 0 ? '#92400E' : '#6B6B6B',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.districtName}
                    </div>
                    <div style={{ fontSize: 11, color: '#9B9B9B' }}>{r.state}</div>
                  </div>
                  <div style={{
                    background: '#EFF6FF', color: '#2563EB',
                    borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}>
                    {r.requestCount} {r.requestCount === 1 ? 'Stimme' : 'Stimmen'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );

  if (embedded) {
    return <div id="anfragen" style={{ padding: innerPadding }}>{inner}</div>;
  }

  return (
    <section id="anfragen" style={{
      background: '#FAFAF8', borderTop: '1px solid #E8E8E4',
      padding: innerPadding, scrollMarginTop: 80,
    }}>
      {inner}
    </section>
  );
}
