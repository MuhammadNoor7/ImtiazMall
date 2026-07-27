import { useEffect, useState } from 'react';

/** Animates 0 -> 1 with an ease-out cubic curve. Re-runs whenever resetKey changes,
 * so charts can replay their reveal animation when the underlying data changes
 * (e.g. after a filter or a model retrain). */
export function useProgress(duration = 800, resetKey: unknown = null): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    let raf = 0;
    let start: number | null = null;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, duration]);

  return progress;
}
