import { BRAND } from '../../lib/brand';

interface Props {
  source: string;
  datenstand: string;
  frequency?: string;
  isLive?: boolean;
}

export function SourceBanner({ source, datenstand, frequency, isLive }: Props) {
  return (
    <div className="bg-base-200/60 border-l-4 border-primary rounded-lg px-3.5 py-2.5 text-[11px] text-base-content/50 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {isLive && <span className="text-success font-bold">● LIVE</span>}
        <span>
          Quelle: <strong className="text-base-content/80">{source}</strong> · Stand: {datenstand}
          {frequency && <span className="text-base-content/35"> ({frequency})</span>}
        </span>
      </div>
      <p className="m-0 text-[10px] text-base-content/30">
        {BRAND.name} ist kein offizielles Behördenportal. Daten stammen aus öffentlichen Quellen unter Datenlizenz Deutschland (dl-de/by-2-0).
      </p>
    </div>
  );
}
