/** Laurel-wreathed medal used to represent the Prix d'Excellence et de Leadership. */
export function PrizeEmblem({ size = 'large' }: { size?: 'large' | 'small' }) {
  const leaves = Array.from({ length: 9 }, (_, i) => i);
  return (
    <div className={`prize-emblem prize-emblem-${size}`} aria-hidden="true">
      <svg viewBox="0 0 240 280">
        <defs>
          <linearGradient id="medalGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f7dc8f" />
            <stop offset="0.45" stopColor="#d9a441" />
            <stop offset="1" stopColor="#9c6a1c" />
          </linearGradient>
          <linearGradient id="ribbonRose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-deep)" />
          </linearGradient>
          <clipPath id="medalClip"><circle cx="120" cy="112" r="62" /></clipPath>
        </defs>
        {/* ribbons */}
        <path className="emblem-ribbon" d="M86 160 L64 262 L90 246 L104 270 L118 170 Z" fill="url(#ribbonRose)" />
        <path className="emblem-ribbon" d="M154 160 L176 262 L150 246 L136 270 L122 170 Z" fill="url(#ribbonRose)" />
        {/* laurel wreath */}
        <g className="emblem-laurel">
          {leaves.map(i => {
            const angle = 245 - i * 15;
            const rad = (angle * Math.PI) / 180;
            const x = 120 + Math.cos(rad) * 86;
            const y = 112 - Math.sin(rad) * 86;
            return <ellipse key={`l${i}`} cx={x} cy={y} rx="7" ry="15" transform={`rotate(${-angle + 18} ${x} ${y})`} style={{ animationDelay: `${i * 70}ms` }} />;
          })}
          {leaves.map(i => {
            const angle = -65 + i * 15;
            const rad = (angle * Math.PI) / 180;
            const x = 120 + Math.cos(rad) * 86;
            const y = 112 - Math.sin(rad) * 86;
            return <ellipse key={`r${i}`} cx={x} cy={y} rx="7" ry="15" transform={`rotate(${-angle - 18} ${x} ${y})`} style={{ animationDelay: `${i * 70}ms` }} />;
          })}
        </g>
        {/* medal */}
        <circle cx="120" cy="112" r="70" fill="url(#medalGold)" />
        <circle cx="120" cy="112" r="62" fill="none" stroke="#fff6d8" strokeOpacity=".55" strokeWidth="2" />
        <g clipPath="url(#medalClip)"><rect className="emblem-shine" x="20" y="20" width="40" height="200" fill="#fff" opacity=".35" transform="rotate(25 120 112)" /></g>
        <path d="M120 70 l11 22 24 3.5 -17.5 17 4 24 -21.5 -11.3 -21.5 11.3 4 -24 -17.5 -17 24 -3.5 z" fill="#fff8e2" opacity=".95" />
        <text x="120" y="160" textAnchor="middle" className="emblem-text">KSD</text>
      </svg>
    </div>
  );
}
