import { CSSProperties, useCallback, useEffect, useState } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import { api, Photo } from '../api';
import { useReveal } from '../hooks';
import { Lightbox } from './Lightbox';
import { Divider } from './Flower';

/** "Souvenirs racontés": photos added by the family, each with the story behind it. */
export function StoryPhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  useEffect(() => { api<Photo[]>('/api/memorial/photos').then(setPhotos).catch(() => undefined); }, []);
  useReveal([photos.length]);
  if (!photos.length) return null;

  const caption = (i: number) => {
    const photo = photos[i];
    const meta = [photo.date, photo.location].filter(Boolean).join(' · ');
    return `${photo.caption}${meta ? `\n${meta}` : ''}`;
  };

  return (
    <section className="story-photos">
      <div className="layout">
        <div className="story-photos-head" data-reveal>
          <Divider />
          <label>Souvenirs racontés</label>
          <h2>Chaque photo a son histoire.</h2>
          <p>Des moments partagés par ses proches, accompagnés des mots qui leur donnent leur sens.</p>
        </div>
        <div className="story-photo-list">
          {photos.map((photo, i) => (
            <article key={photo._id} className={`story-photo${i % 2 ? ' reverse' : ''}`} data-reveal style={{ '--d': 0 } as CSSProperties}>
              <button className="story-photo-image" onClick={() => setOpen(i)} aria-label="Agrandir la photo">
                <img src={photo.imageUrl} alt={photo.caption.slice(0, 120)} loading="lazy" />
              </button>
              <div className="story-photo-text">
                <span className="story-photo-number">{String(i + 1).padStart(2, '0')}</span>
                <p>{photo.caption}</p>
                {(photo.date || photo.location) && (
                  <small>
                    {photo.date && <span><CalendarDays size={13} /> {photo.date}</span>}
                    {photo.location && <span><MapPin size={13} /> {photo.location}</span>}
                  </small>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
      <Lightbox images={photos.map(p => p.imageUrl)} initialIndex={open} onClose={close} label="Souvenirs racontés" caption={caption} variant="story" />
    </section>
  );
}
