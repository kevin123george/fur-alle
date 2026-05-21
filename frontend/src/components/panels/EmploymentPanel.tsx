import { useEmployment } from '../../hooks/useEmployment';
import { KreisMap } from '../maps/KreisMap';
import { SourceBadge } from '../charts/SourceBadge';

export function EmploymentPanel() {
  const { data, loading, error } = useEmployment();

  const datenstand = data?.[0]?.dataDate ?? '';

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
        Arbeitslosigkeit nach Landkreis
      </h2>
      <SourceBadge source="Statistik der Bundesagentur für Arbeit" datenstand={datenstand} />

      {error && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm">
          Daten werden geladen… {error}
        </div>
      )}

      {loading && (
        <div className="mt-8 flex justify-center">
          <div className="animate-pulse text-slate-400 text-sm">Lade Beschäftigungsdaten…</div>
        </div>
      )}

      {data && !loading && (
        <div className="mt-4">
          <KreisMap data={data} />
        </div>
      )}
    </section>
  );
}
