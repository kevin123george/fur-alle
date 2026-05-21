import { Link } from 'react-router-dom';
import { BRAND } from '../../lib/brand';

export function Footer() {
  return (
    <footer style={{
      background: '#0f172a',
      padding: '36px 24px 28px',
      marginTop: 64,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.2px' }}>
            {BRAND.name}
          </div>
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.4)',
            margin: 0, textAlign: 'center', maxWidth: 520, lineHeight: 1.7,
          }}>
            Kein offizielles Behördenportal. Daten aus öffentlichen Quellen unter{' '}
            <a
              href="https://www.govdata.de/dl-de/by-2-0"
              style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'underline' }}
            >
              Datenlizenz Deutschland (dl-de/by-2-0)
            </a>.
            {' '}Karte: ©{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'underline' }}
            >
              OpenStreetMap
            </a>{' '}
            contributors.
          </p>
          <div style={{ display: 'flex', gap: 24, fontSize: 12 }}>
            <Link to="/impressum" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >Impressum</Link>
            <Link to="/datenschutz" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >Datenschutz</Link>
            <a
              href="https://github.com/kevin123george/fur-alle"
              target="_blank" rel="noopener"
              style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >GitHub</a>
            <a
              href="https://www.linkedin.com/in/kevin-george123/"
              target="_blank" rel="noopener"
              style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
