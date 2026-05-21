const STEPS = [
  {
    icon: '🏛️',
    title: 'Wir sammeln',
    description: 'Automatisch aus Behördenportalen: Bundesnetzagentur, Bundesagentur für Arbeit, Destatis, Regionaldatenbank.',
    color: '#EFF6FF',
    accent: '#2563EB',
  },
  {
    icon: '🔍',
    title: 'Wir prüfen',
    description: 'Rohdaten werden validiert, bereinigt und erst nach vollständiger Prüfung veröffentlicht — nie halbfertige Daten.',
    color: '#ECFDF5',
    accent: '#10B981',
  },
  {
    icon: '📊',
    title: 'Du siehst',
    description: 'Live-Dashboards je Landkreis. Immer mit Quellenangabe, Datum und Datenstand — transparent und verlässlich.',
    color: '#FFFBEB',
    accent: '#F59E0B',
  },
];

export function HowItWorks() {
  return (
    <section style={{
      background: '#fff', borderTop: '1px solid #E8E8E4', borderBottom: '1px solid #E8E8E4',
      padding: '56px 24px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>
            Wie funktioniert es?
          </h2>
          <p style={{ color: '#6B6B6B', fontSize: 15, margin: 0 }}>
            Kein Login. Keine Registrierung. Alles kostenlos und frei zugänglich.
          </p>
        </div>

        <div className="how-it-works-grid">
          {STEPS.map((step, i) => (
            <div key={i} style={{
              background: step.color, borderRadius: 14,
              padding: '28px 24px', position: 'relative',
              border: `1px solid ${step.accent}22`,
            }}>
              <div style={{
                position: 'absolute', top: -14, left: 24,
                background: step.accent, color: '#fff',
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{step.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, color: '#6B6B6B', margin: 0, lineHeight: 1.6 }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
