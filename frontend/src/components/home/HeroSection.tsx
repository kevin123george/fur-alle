import { useNavigate } from 'react-router-dom';
import { KreisMap } from '../maps/KreisMap';
import type { EmploymentDTO } from '../../types/employment';
import { kreisPath } from '../../lib/kreis-slugs';

interface Props {
  employment: EmploymentDTO[];
  loading: boolean;
}

export function HeroSection({ employment, loading }: Props) {
  const navigate = useNavigate();
  const active = employment.slice(0, 12); // top 12 for the list

  return (
    <section className="hero-grid" style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 32px' }}>
      {/* Left — headline + map */}
      <div>
        <div style={{ marginBottom: 24 }}>
          <span style={{
            display: 'inline-block',
            background: '#EFF6FF', color: '#2563EB',
            borderRadius: 999, padding: '4px 12px',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
            marginBottom: 12,
          }}>
            BETA · Erstes freies Echtzeit-Dashboard für Deutschland
          </span>
          <h1 style={{
            fontSize: 40, fontWeight: 800, lineHeight: 1.15,
            color: '#1A1A1A', margin: '0 0 12px 0', letterSpacing: '-0.5px',
          }}>
            Dein Landkreis.<br />
            Deine Daten.<br />
            <span style={{ color: '#2563EB' }}>Dein Recht.</span>
          </h1>
          <p style={{ fontSize: 16, color: '#6B6B6B', margin: 0, maxWidth: 480, lineHeight: 1.6 }}>
            Öffentliche Daten aus deutschen Bundes- und Landesbehörden —
            endlich verständlich aufbereitet und für alle zugänglich.
          </p>
        </div>

        <KreisMap data={employment} interactive height={460} />

        <p style={{ fontSize: 11, color: '#9B9B9B', marginTop: 8, textAlign: 'center' }}>
          Karte klicken für Kreis-Details · Grau = Daten noch nicht verfügbar
        </p>
      </div>

      {/* Right — active districts list */}
      <div>
        <div style={{
          background: '#fff', borderRadius: 14,
          border: '1px solid #E8E8E4',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #E8E8E4',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A' }}>Verfügbare Landkreise</div>
              <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2 }}>
                {loading ? '…' : `${employment.length} mit Daten`}
              </div>
            </div>
            <span style={{
              background: '#ECFDF5', color: '#059669',
              borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 700,
            }}>
              LIVE
            </span>
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ padding: '12px 20px', borderBottom: '1px solid #E8E8E4' }}>
                  <div className="skeleton" style={{ height: 13, width: '70%', borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 11, width: '40%', borderRadius: 4, marginTop: 6 }} />
                </div>
              ))
            ) : active.length > 0 ? (
              active.map(d => (
                <button
                  key={d.ags}
                  onClick={() => navigate(kreisPath(d.ags))}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none',
                    border: 'none', borderBottom: '1px solid #E8E8E4',
                    padding: '12px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FF')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{d.districtName}</div>
                    <div style={{ fontSize: 11, color: '#6B6B6B', marginTop: 2 }}>
                      ALQ: <strong style={{ color: '#2563EB' }}>{d.unemploymentRate ?? '—'} %</strong>
                      {' · '}{d.dataDate}
                    </div>
                  </div>
                  <span style={{ color: '#2563EB', fontSize: 16, fontWeight: 300 }}>→</span>
                </button>
              ))
            ) : (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9B9B9B', fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
                Beschäftigungsdaten werden geladen…<br />
                <span style={{ fontSize: 11 }}>Führe <code>run_once.py employment</code> aus.</span>
              </div>
            )}
          </div>

          {employment.length > 12 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E8E8E4', textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: '#6B6B6B' }}>
                + {employment.length - 12} weitere Landkreise auf der Karte
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{
          marginTop: 16, background: '#fff', borderRadius: 12,
          border: '1px solid #E8E8E4', padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>Expansion läuft</span>
            <span style={{ fontSize: 12, color: '#6B6B6B' }}>
              {employment.length} / 401 Landkreise
            </span>
          </div>
          <div style={{ height: 6, background: '#E8E8E4', borderRadius: 999 }}>
            <div style={{
              height: '100%', background: '#2563EB', borderRadius: 999,
              width: `${Math.max(2, (employment.length / 401) * 100)}%`,
              transition: 'width 0.5s',
            }} />
          </div>
          <p style={{ fontSize: 11, color: '#9B9B9B', margin: '8px 0 0 0' }}>
            Weitere Datenquellen kommen monatlich dazu.
          </p>
        </div>
      </div>
    </section>
  );
}
