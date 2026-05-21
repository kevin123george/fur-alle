import { Link } from 'react-router-dom';
import { BRAND } from '../lib/brand';

export function Impressum() {
  return (
    <div className="bg-base-200 min-h-screen">
      <main className="max-w-[720px] mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-base-content/40 mb-8">
          <Link to="/" className="text-primary font-semibold no-underline hover:text-primary/70">{BRAND.name}</Link>
          <span>›</span>
          <span>Impressum</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-base-content tracking-tight mb-1">Impressum</h1>
        <p className="text-sm text-base-content/40 mb-10">Angaben gemäß § 5 TMG</p>

        <Section title="Verantwortlich">
          <address className="not-italic text-sm text-base-content/70 leading-relaxed">
            <strong className="text-base-content">Kevin</strong><br />
            [Straße und Hausnummer]<br />
            [PLZ Ort]<br />
            Deutschland<br />
            <br />
            E-Mail:{' '}
            <a href="mailto:techatkevin@gmail.com" className="text-primary no-underline hover:underline">
              techatkevin@gmail.com
            </a>
          </address>
        </Section>

        <Section title="Über dieses Projekt">
          <p className="text-sm text-base-content/70 leading-relaxed">
            <strong className="text-base-content">{BRAND.name}</strong> ist ein kostenloses Bürger-Dashboard,
            das öffentlich verfügbare Daten der deutschen Verwaltung für alle zugänglich macht. Keine
            Registrierung, kein Login, keine Werbung. Alle angezeigten Daten stammen aus amtlichen
            Quellen und sind bereits öffentlich — wir aggregieren sie lediglich und stellen sie
            übersichtlich dar.
          </p>
        </Section>

        <Section title="Datenquellen & Lizenzen">
          <div className="flex flex-col gap-3">
            <SourceRow name="Stromnetz-Daten" provider="Bundesnetzagentur | SMARD.de"
              license="Datenlizenz Deutschland – Namensnennung 2.0 (dl-de/by-2-0)"
              url="https://www.smard.de" cadence="alle 15 Min." />
            <SourceRow name="Arbeitsmarkt-Daten" provider="Statistik der Bundesagentur für Arbeit"
              license="Datenlizenz Deutschland – Namensnennung 2.0 (dl-de/by-2-0)"
              url="https://statistik.arbeitsagentur.de" cadence="monatlich" />
            <SourceRow name="Wetterdaten" provider="Deutscher Wetterdienst (DWD) via Brightsky API"
              license="Creative Commons Attribution 4.0 (CC BY 4.0)"
              url="https://brightsky.dev" cadence="stündlich" />
            <SourceRow name="Luftqualitätsdaten" provider="Umweltbundesamt (UBA)"
              license="Datenlizenz Deutschland – Namensnennung 2.0 (dl-de/by-2-0)"
              url="https://www.umweltbundesamt.de/daten/luft" cadence="stündlich" />
            <SourceRow name="Karten & Infrastruktur" provider="OpenStreetMap contributors"
              license="Open Database Licence (ODbL)"
              url="https://www.openstreetmap.org/copyright" cadence="kontinuierlich" />
            <SourceRow name="Kreisgrenzen" provider="Bundesamt für Kartographie und Geodäsie (BKG)"
              license="Datenlizenz Deutschland – Namensnennung 2.0 (dl-de/by-2-0)"
              url="https://gdz.bkg.bund.de" cadence="jährlich" />
          </div>
        </Section>

        <Section title="Haftungsausschluss">
          <p className="text-sm text-base-content/70 leading-relaxed">
            Dieses Angebot stellt keine amtliche Auskunft dar. Für die Richtigkeit, Vollständigkeit
            und Aktualität der dargestellten Informationen wird keine Gewähr übernommen. Die jeweils
            gültigen Primärquellen sind direkt verlinkt und maßgeblich. Bei Abweichungen gilt stets
            die Originalquelle.
          </p>
        </Section>

        <Section title="Technologie">
          <p className="text-sm text-base-content/70 leading-relaxed mb-3">
            Open-Source-Stack: Python ETL · Spring Boot API · React/TypeScript Frontend ·
            PostgreSQL · Leaflet + OpenStreetMap (DSGVO-konform, keine US-Dienste).
          </p>
          <a href="https://github.com/kevin123george/fur-alle" className="text-sm text-primary font-semibold no-underline hover:underline">
            → Quellcode auf GitHub
          </a>
        </Section>

        <div className="mt-10 pt-6 border-t border-base-200 flex gap-5">
          <Link to="/datenschutz" className="text-sm text-primary no-underline hover:underline">
            Datenschutzerklärung
          </Link>
          <Link to="/" className="text-sm text-base-content/40 no-underline hover:text-base-content/70">
            ← Zurück zur Startseite
          </Link>
        </div>

      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-bold text-base-content mb-3 pb-2 border-b border-base-200">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SourceRow({ name, provider, license, url, cadence }: {
  name: string; provider: string; license: string; url: string; cadence: string;
}) {
  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-200 p-4">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <div className="text-sm font-bold text-base-content mb-0.5">{name}</div>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-primary no-underline hover:underline">
            {provider}
          </a>
          <div className="text-[11px] text-base-content/40 mt-1">{license}</div>
        </div>
        <span className="badge badge-primary badge-sm shrink-0">{cadence}</span>
      </div>
    </div>
  );
}
