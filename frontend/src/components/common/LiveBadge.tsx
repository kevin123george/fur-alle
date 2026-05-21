export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-success/10 text-success rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide">
      <span className="live-dot w-1.5 h-1.5 rounded-full bg-success inline-block" />
      LIVE
    </span>
  );
}
