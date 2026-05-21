interface Props {
  source: string;
  datenstand: string;
}

export function SourceBadge({ source, datenstand }: Props) {
  return (
    <p className="text-xs text-slate-500 mt-1">
      Quelle: {source} · Stand: {datenstand}
    </p>
  );
}
