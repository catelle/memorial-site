/** Small five-petal flower used as an ornament throughout the site. */
export function Flower({ className = '' }: { className?: string }) {
  return (
    <svg className={`flower ${className}`} viewBox="0 0 40 40" aria-hidden="true">
      {[0, 72, 144, 216, 288].map(angle => (
        <ellipse key={angle} cx="20" cy="10.5" rx="6" ry="9.5" transform={`rotate(${angle} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="4.2" className="flower-heart" />
    </svg>
  );
}

export function Divider() {
  return (
    <div className="flower-divider" aria-hidden="true">
      <span />
      <Flower />
      <span />
    </div>
  );
}
