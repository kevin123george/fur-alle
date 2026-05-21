import { useCountUp } from '../../hooks/useCountUp';

interface Props {
  value: number | null;
  format: (n: number) => string;
  duration?: number;
  fallback?: string;
}

export function AnimatedNumber({ value, format, duration = 900, fallback = '—' }: Props) {
  const animated = useCountUp(value, duration);
  if (animated === null) return <>{fallback}</>;
  return <>{format(animated)}</>;
}
