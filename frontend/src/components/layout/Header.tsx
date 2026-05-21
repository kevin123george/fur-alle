import { Link } from 'react-router-dom';
import { BRAND } from '../../lib/brand';

export function Header() {
  return (
    <header style={{
      borderBottom: '1px solid #E8E8E4',
      background: '#fff',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    }}>
      {/* Blue accent bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #1e3a5f, #2563EB, #3b82f6)' }} />

      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 24px',
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.3px' }}>
            {BRAND.name}
          </span>
          <span style={{ fontSize: 12, color: '#9B9B9B', fontWeight: 500 }}>
            Öffentliche Daten · Deutschland
          </span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <a
            href="https://github.com/kevin123george/fur-alle"
            target="_blank" rel="noopener noreferrer"
            style={{
              padding: '7px 12px', borderRadius: 8,
              fontSize: 13, color: '#6B6B6B', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#1A1A1A'; e.currentTarget.style.background = '#F4F3EF'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6B6B6B'; e.currentTarget.style.background = 'none'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-label="GitHub">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            GitHub
          </a>
          <Link
            to="/#anfragen"
            onClick={e => {
              const el = document.getElementById('anfragen');
              if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
            }}
            style={{
              padding: '7px 14px', borderRadius: 8,
              background: '#2563EB', color: '#fff',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2563EB')}
          >
            Landkreis anfragen
          </Link>
          <Link to="/impressum" style={{ fontSize: 13, color: '#9B9B9B', textDecoration: 'none', padding: '7px 10px' }}>
            Impressum
          </Link>
        </nav>
      </div>
    </header>
  );
}
