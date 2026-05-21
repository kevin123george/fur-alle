import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useParams, useLocation, useNavigate } from 'react-router-dom';
import { kreisPath } from './lib/kreis-slugs';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { KreisSearchModal } from './components/search/KreisSearchModal';
import { Dashboard } from './pages/Dashboard';
import { KreisPage } from './pages/KreisPage';
import { KreisStellen } from './pages/KreisStellen';
import { KreisNachrichten } from './pages/KreisNachrichten';
import { NachrichtenPage } from './pages/NachrichtenPage';
import { StellenPage } from './pages/StellenPage';
import { BundeslaenderPage } from './pages/BundeslaenderPage';
import { BundeslandDetailPage } from './pages/BundeslandDetailPage';
import { SharePage } from './pages/SharePage';
import { HomeSharePage } from './pages/HomeSharePage';
import { Impressum } from './pages/Impressum';
import { Datenschutz } from './pages/Datenschutz';

function KreisRedirect({ stellen }: { stellen?: boolean }) {
  const { ags } = useParams<{ ags: string }>();
  const base = kreisPath(ags ?? '');
  return <Navigate to={stellen ? `${base}/stellen` : base} replace />;
}

function MobileBottomNav({ onOpenSearch, sidebarExpanded, toggleSidebar }: { onOpenSearch: () => void; sidebarExpanded: boolean; toggleSidebar: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isKreis = pathname.startsWith('/kreis/');

  if (sidebarExpanded) return null;

  return (
    <nav className="btm-nav btm-nav-sm lg:hidden z-50 border-t border-base-200">
      <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
        <span className="text-lg">🏠</span>
        <span className="btm-nav-label text-[10px]">Übersicht</span>
      </NavLink>
      <button onClick={onOpenSearch}>
        <span className="text-lg">🔍</span>
        <span className="btm-nav-label text-[10px]">Suche</span>
      </button>
      {isKreis ? (
        <button onClick={() => navigate(-1)}>
          <span className="text-lg">←</span>
          <span className="btm-nav-label text-[10px]">Zurück</span>
        </button>
      ) : (
        <NavLink to="/stellen" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="text-lg">💼</span>
          <span className="btm-nav-label text-[10px]">Stellen</span>
        </NavLink>
      )}
      <button onClick={toggleSidebar}>
        <span className="text-lg">☰</span>
        <span className="btm-nav-label text-[10px]">Menü</span>
      </button>
    </nav>
  );
}

function AppLayout({ searchOpen, setSearchOpen, sidebarExpanded, toggleSidebar }: {
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  sidebarExpanded: boolean;
  toggleSidebar: () => void;
}) {
  return (
    <>
      <div className="drawer lg:drawer-open">
        <input id="sidebar-toggle" type="checkbox" className="drawer-toggle" />

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="drawer-content flex flex-col min-h-screen">
          <TopBar onOpenSearch={() => setSearchOpen(true)} onToggleSidebar={toggleSidebar} sidebarExpanded={sidebarExpanded} />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/kreis/:stateSlug/:kreisSlug" element={<KreisPage />} />
              <Route path="/kreis/:stateSlug/:kreisSlug/stellen" element={<KreisStellen />} />
              <Route path="/kreis/:stateSlug/:kreisSlug/nachrichten" element={<KreisNachrichten />} />
              <Route path="/kreis/:ags" element={<KreisRedirect />} />
              <Route path="/kreis/:ags/stellen" element={<KreisRedirect stellen />} />
              <Route path="/bundeslaender" element={<BundeslaenderPage />} />
              <Route path="/bundeslaender/:slug" element={<BundeslandDetailPage />} />
              <Route path="/stellen" element={<StellenPage />} />
              <Route path="/nachrichten" element={<NachrichtenPage />} />
              <Route path="/share" element={<HomeSharePage />} />
              <Route path="/share/:ags" element={<SharePage />} />
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/datenschutz" element={<Datenschutz />} />
            </Routes>
          </div>
          <KreisSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <div className="drawer-side z-40">
          <label htmlFor="sidebar-toggle" aria-label="close sidebar" className="drawer-overlay" />
          <Sidebar onOpenSearch={() => setSearchOpen(true)} expanded={sidebarExpanded} />
        </div>
      </div>

      {/* ── Mobile bottom nav — outside drawer so position:fixed works correctly ── */}
      <MobileBottomNav onOpenSearch={() => setSearchOpen(true)} sidebarExpanded={sidebarExpanded} toggleSidebar={toggleSidebar} />
    </>
  );
}

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(() =>
    localStorage.getItem('sidebarExpanded') === 'true'
  );

  function toggleSidebar() {
    setSidebarExpanded(prev => {
      const next = !prev;
      localStorage.setItem('sidebarExpanded', String(next));
      return next;
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <BrowserRouter>
      <AppLayout
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        sidebarExpanded={sidebarExpanded}
        toggleSidebar={toggleSidebar}
      />
    </BrowserRouter>
  );
}
