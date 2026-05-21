import { useEffect, useRef, useState } from 'react';

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useCountUp(target: number | null, duration = 900): number | null {
  const [value, setValue] = useState<number | null>(null);
  const frameRef = useRef<number>(0);
  const prevRef = useRef<number>(0);

  useEffect(() => {
    if (target === null) return;
    const end: number = target;
    cancelAnimationFrame(frameRef.current);
    const from = prevRef.current;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      setValue(from + (end - from) * easeOut(progress));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setValue(end);
        prevRef.current = end;
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}
