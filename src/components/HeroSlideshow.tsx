import { useEffect, useState } from 'react';
import { Flower } from './Flower';

const SLIDE_DURATION = 5200;

export function HeroSlideshow({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || images.length < 2) return;
    const timer = window.setTimeout(() => setIndex(current => (current + 1) % images.length), SLIDE_DURATION);
    return () => window.clearTimeout(timer);
  }, [index, paused, images.length]);

  return (
    <div className="portrait" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="portrait-halo" aria-hidden="true" />
      <div className="portrait-ring portrait-ring-outer" aria-hidden="true">
        <Flower className="ring-flower f1" />
        <Flower className="ring-flower f2" />
        <Flower className="ring-flower f3" />
      </div>
      <div className="portrait-ring portrait-ring-inner" aria-hidden="true" />
      <div className="portrait-frame" role="img" aria-label={`Portraits de ${name}`}>
        {images.map((src, i) => (
          <img key={src} src={src} alt="" className={i === index ? 'active' : ''} aria-hidden={i !== index} decoding="async" />
        ))}
      </div>
      <div className="portrait-dots" role="tablist" aria-label="Choisir un portrait">
        {images.map((src, i) => (
          <button
            key={src}
            role="tab"
            aria-selected={i === index}
            aria-label={`Portrait ${i + 1}`}
            className={i === index ? 'active' : ''}
            onClick={() => setIndex(i)}
          >
            {i === index && <span style={{ animationDuration: `${SLIDE_DURATION}ms`, animationPlayState: paused ? 'paused' : 'running' }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
