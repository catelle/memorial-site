import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type Props = {
  images: string[];
  initialIndex: number | null;
  onClose: () => void;
  label?: string;
  caption?: (index: number) => string;
  variant?: 'photo' | 'document' | 'story';
};

export function Lightbox({ images, initialIndex, onClose, label = 'Galerie de souvenirs', caption, variant = 'photo' }: Props) {
  const [index, setIndex] = useState(initialIndex ?? 0);
  const next = useCallback(() => setIndex(current => (current + 1) % images.length), [images.length]);
  const prev = useCallback(() => setIndex(current => (current - 1 + images.length) % images.length), [images.length]);
  const thumbs = useRef<HTMLDivElement>(null);

  useEffect(() => { if (initialIndex !== null) setIndex(initialIndex); }, [initialIndex]);
  useEffect(() => {
    if (initialIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = ''; };
  }, [initialIndex, onClose, next, prev]);
  useEffect(() => {
    thumbs.current?.querySelector('.selected')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [index]);

  if (initialIndex === null) return null;
  return (
    <div className={`gallery-lightbox lightbox-${variant}`} role="dialog" aria-modal="true" aria-label={label} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <button className="lightbox-close" onClick={onClose} aria-label="Fermer"><X size={22} /></button>
      <button className="lightbox-arrow lightbox-prev" onClick={prev} aria-label="Précédent"><ChevronLeft size={28} /></button>
      <figure className="lightbox-figure">
        <img key={index} src={images[index]} alt={caption ? caption(index) : `Souvenir ${index + 1} de Stéphanie`} />
        <figcaption>{caption ? caption(index) : `Souvenir ${index + 1} sur ${images.length}`}</figcaption>
      </figure>
      <button className="lightbox-arrow lightbox-next" onClick={next} aria-label="Suivant"><ChevronRight size={28} /></button>
      <div className="lightbox-thumbnails" ref={thumbs}>
        {images.map((image, i) => (
          <button className={i === index ? 'selected' : ''} key={image} onClick={() => setIndex(i)} aria-label={`Voir l’élément ${i + 1}`}><img src={image} alt="" loading="lazy" /></button>
        ))}
      </div>
    </div>
  );
}
