import { Link } from 'react-router-dom';
import { BRAND } from '../lib/brand';

export function Datenschutz() {
  return (
    <div className="bg-base-200 min-h-screen">
      <main className="max-w-[720px] mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-base-content/40 mb-8">
          <Link to="/" className="text-primary font-semibold no-underline hover:text-primary/70">{BRAND.name}</Link>
          <span>›</span>
          <span>Datenschutzerklärung</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-base-content tracking-tight mb-1">Datenschutzerklärung</h1>
        <p className="text-sm text-base-content/40 mb-10">Gemäß DSGVO / GDPR</p>

        <Section title="Grundsatz">
          <p className="text-sm text-base-content/70 leading-relaxed">
            Dieses Angebot verarbeitet keine personenbezogenen Daten. Es werden keine Tracking-Dienste,
            keine Analysedienste und keine Social-Media-Plugins eingesetzt.
          </p>
        </Section>

        <Section title="Kartendienst">
          <p className="text-sm text-base-content/70 leading-relaxed">
            Die Kartenansicht verwendet OpenStreetMap-Kacheln, die direkt von den OSM-Servern geladen werden.
            Dabei wird Ihre IP-Adresse an die Server der OpenStreetMap Foundation (UK) übertragen.
            Es handelt sich um eine berechtigte Nutzung im Sinne von Art. 6 Abs. 1 lit. f DSGVO
            (berechtigtes Interesse an der Darstellung aktueller Kartendaten ohne Drittanbieter-Tracking).
            Alternativ können Sie die Kartenansicht deaktivieren.{' '}
            Datenschutzerklärung von OpenStreetMap:{' '}
            <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer"
              className="text-primary no-underline hover:underline">
              osmfoundation.org/wiki/Privacy_Policy
            </a>
          </p>
        </Section>

        <Section title="Serverprotokolle">
          <p className="text-sm text-base-content/70 leading-relaxed">
            Beim Aufruf dieser Website werden standardmäßig Serverprotokolle (Access Logs) erstellt,
            die Ihre IP-Adresse, den Zeitpunkt des Abrufs und die abgerufene Ressource enthalten.
            Diese Protokolle werden nach spätestens 7 Tagen automatisch gelöscht und nicht
            mit anderen Daten verknüpft.
          </p>
        </Section>

        <Section title="Keine Cookies">
          <p className="text-sm text-base-content/70 leading-relaxed">
            Diese Website setzt keine Cookies ein.
          </p>
        </Section>

        <Section title="Kontakt">
          <p className="text-sm text-base-content/70">
            Bei Fragen zum Datenschutz:{' '}
            <a href="mailto:techatkevin@gmail.com" className="text-primary no-underline hover:underline">
              techatkevin@gmail.com
            </a>
          </p>
        </Section>

        <div className="mt-10 pt-6 border-t border-base-200 flex gap-5">
          <Link to="/impressum" className="text-sm text-primary no-underline hover:underline">
            Impressum
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
