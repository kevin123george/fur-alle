interface Props { height?: number; }

export function SkeletonCard({ height = 80 }: Props) {
  return (
    <div className="skeleton" style={{ height, borderRadius: 12 }} />
  );
}

export function SkeletonText({ width = '60%' }: { width?: string }) {
  return <div className="skeleton" style={{ height: 14, width, borderRadius: 4 }} />;
}
