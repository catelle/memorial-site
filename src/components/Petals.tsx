import { CSSProperties, useMemo } from 'react';

/** Gently falling petals across the whole page (hidden when reduced motion is requested). */
export function Petals({ count = 16 }: { count?: number }) {
  const petals = useMemo(() => {
    let seed = 7;
    const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    return Array.from({ length: count }, () => ({
      left: `${random() * 100}%`,
      size: 9 + random() * 12,
      duration: 14 + random() * 14,
      delay: -random() * 28,
      sway: 3 + random() * 4,
      opacity: 0.35 + random() * 0.4,
    }));
  }, [count]);

  return (
    <div className="petals" aria-hidden="true">
      {petals.map((petal, i) => (
        <span
          key={i}
          className="petal"
          style={{
            left: petal.left,
            animationDuration: `${petal.duration}s`,
            animationDelay: `${petal.delay}s`,
            opacity: petal.opacity,
          } as CSSProperties}
        >
          <i style={{ width: petal.size, height: petal.size * 0.78, animationDuration: `${petal.sway}s` }} />
        </span>
      ))}
    </div>
  );
}
