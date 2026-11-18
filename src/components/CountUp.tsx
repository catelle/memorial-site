import { useEffect, useRef, useState } from 'react';
import { useInView, usePrefersReducedMotion } from '../hooks';

/** Animates a number from `from` to `value` once it scrolls into view. */
export function CountUp({ value, from = 0, duration = 1600 }: { value: number; from?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : from);

  useEffect(() => {
    if (!inView) return;
    if (reduced) { setDisplay(value); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, from, duration, reduced]);

  return <span ref={ref}>{display}</span>;
}
