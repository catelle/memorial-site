import { useState } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, Check, ImagePlus, Loader2, Pencil, Trash2, Upload, X } from 'lucide-react';
import { api, compressImage, Photo, PhotoSection } from '../api';

type Draft = { key: string; imageData: string; caption: string; date: string; location: string; status: 'pending' | 'saving' | 'error'; error?: string };

const intro: Record<PhotoSection, { title: string; text: string; empty: string }> = {
  home: {
    title: 'Chaque photo, avec son histoire',
    text: 'Choisissez une ou plusieurs photos, puis écrivez pour chacune le commentaire qui l’accompagne : qui, quand, où, ce que ce moment représente. Elles apparaîtront sur la page d’accueil dans « Souvenirs racontés ».',
    empty: 'Aucune photo commentée pour le moment.',
  },
  prix: {
    title: 'Les moments du Prix d’Excellence',
    text: 'Ajoutez les photos de la cérémonie, des lauréats ou de la remise des dotations, chacune avec son commentaire : qui, quelle édition, ce que ce moment représente. Elles apparaîtront sur la page du Prix dans « En images ».',
    empty: 'Aucune photo du Prix pour le moment.',
  },
};

/** Family-space tool: upload several photos at once, each with its own caption (the story behind it). */
export function PhotoManager({ section = 'home', photos, setPhotos, onDone, onError }: { section?: PhotoSection; photos: Photo[]; setPhotos: (update: (current: Photo[]) => Photo[]) => void; onDone: (text: string) => void; onError: (error: unknown) => void }) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [reading, setReading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [editing, setEditing] = useState<Photo | null>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setReading(true);
    const next: Draft[] = [];
    for (const file of Array.from(files)) {
      try { next.push({ key: `${file.name}-${file.lastModified}-${Math.random()}`, imageData: await compressImage(file, 1600, 0.82), caption: '', date: '', location: '', status: 'pending' }); }
      catch (error) { onError(error); }
    }
    setDrafts(current => [...current, ...next]);
    setReading(false);
  };
  const patch = (key: string, values: Partial<Draft>) => setDrafts(current => current.map(d => (d.key === key ? { ...d, ...values } : d)));

  const publishAll = async () => {
    const missing = drafts.filter(d => !d.caption.trim());
    if (missing.length) { onError(new Error(`Ajoutez un commentaire à chaque photo (${missing.length} manquant${missing.length > 1 ? 's' : ''}).`)); return; }
    setPublishing(true);
    let published = 0;
    for (const draft of drafts) {
      patch(draft.key, { status: 'saving', error: undefined });
      try {
        const saved = await api<Photo>('/api/memorial/photos', { method: 'POST', auth: true, body: { section, imageData: draft.imageData, caption: draft.caption, date: draft.date, location: draft.location } });
        setPhotos(current => [...current, saved]);
        setDrafts(current => current.filter(d => d.key !== draft.key));
        published += 1;
      } catch (error) {
        patch(draft.key, { status: 'error', error: error instanceof Error ? error.message : 'Échec' });
        if (error instanceof Error && /session|autoris/i.test(error.message)) { onError(error); break; }
      }
    }
    setPublishing(false);
    if (published) onDone(`${published} photo${published > 1 ? 's publiées' : ' publiée'} sur le site.`);
  };

  const saveEdit = async () => {
    if (!editing?._id) return;
    if (!editing.caption.trim()) { onError(new Error('Le commentaire ne peut pas être vide.')); return; }
    try {
      const saved = await api<Photo>(`/api/memorial/photos/${editing._id}`, { method: 'PUT', auth: true, body: { caption: editing.caption, date: editing.date, location: editing.location } });
      setPhotos(current => current.map(p => (p._id === saved._id ? saved : p)));
      setEditing(null);
      onDone('Commentaire mis à jour.');
    } catch (error) { onError(error); }
  };

  const remove = async (photo: Photo) => {
    if (!photo._id || !window.confirm('Retirer cette photo du site ?')) return;
    try { await api(`/api/memorial/photos/${photo._id}`, { method: 'DELETE', auth: true }); setPhotos(current => current.filter(p => p._id !== photo._id)); onDone('Photo retirée.'); }
    catch (error) { onError(error); }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const other = photos[index + direction];
    const photo = photos[index];
    if (!other?._id || !photo._id) return;
    const orderA = photo.order ?? index + 1; const orderB = other.order ?? index + direction + 1;
    try {
      const [a, b] = await Promise.all([
        api<Photo>(`/api/memorial/photos/${photo._id}`, { method: 'PUT', auth: true, body: { caption: photo.caption, date: photo.date, location: photo.location, order: orderB === orderA ? orderA + direction : orderB } }),
        api<Photo>(`/api/memorial/photos/${other._id}`, { method: 'PUT', auth: true, body: { caption: other.caption, date: other.date, location: other.location, order: orderA } }),
      ]);
      setPhotos(current => { const copy = current.map(p => (p._id === a._id ? a : p._id === b._id ? b : p)); return copy.sort((x, y) => (x.order ?? 0) - (y.order ?? 0)); });
    } catch (error) { onError(error); }
  };

  return (
    <div className="photo-manager">
      <div className="admin-card">
        <label>Ajouter des photos commentées</label>
        <h2>{intro[section].title}</h2>
        <p>{intro[section].text}</p>
        <label className="image-drop photo-drop">
          <input type="file" accept="image/*" multiple onChange={event => { addFiles(event.target.files); event.target.value = ''; }} />
          {reading ? <Loader2 size={22} className="spin" /> : <ImagePlus size={22} />}
          <span>{reading ? 'Préparation des images…' : 'Choisir des photos (plusieurs possibles)'}</span>
        </label>

        {drafts.length > 0 && (
          <div className="draft-list">
            {drafts.map((draft, i) => (
              <div className={`draft${draft.status === 'error' ? ' has-error' : ''}`} key={draft.key}>
                <div className="draft-image"><img src={draft.imageData} alt="" />{draft.status === 'saving' && <span><Loader2 size={20} className="spin" /></span>}</div>
                <div className="draft-fields">
                  <textarea rows={3} placeholder={`Commentaire de la photo ${i + 1} *`} value={draft.caption} onChange={e => patch(draft.key, { caption: e.target.value })} disabled={publishing} />
                  <div className="update-form-row">
                    <input placeholder="Date (ex. Juillet 2023)" value={draft.date} onChange={e => patch(draft.key, { date: e.target.value })} disabled={publishing} />
                    <input placeholder="Lieu (facultatif)" value={draft.location} onChange={e => patch(draft.key, { location: e.target.value })} disabled={publishing} />
                  </div>
                  {draft.error && <p className="notice notice-error"><AlertCircle size={15} /> {draft.error}</p>}
                </div>
                <button className="draft-remove" onClick={() => setDrafts(current => current.filter(d => d.key !== draft.key))} disabled={publishing} aria-label="Retirer"><X size={16} /></button>
              </div>
            ))}
            <div className="form-actions">
              <button className="gold" onClick={publishAll} disabled={publishing}>{publishing ? <><Loader2 size={15} className="spin" /> Publication…</> : <><Upload size={15} /> Publier {drafts.length} photo{drafts.length > 1 ? 's' : ''}</>}</button>
              <button className="paper" onClick={() => setDrafts([])} disabled={publishing}>Tout annuler</button>
            </div>
          </div>
        )}
      </div>

      <div className="manage-list">
        {photos.length === 0 && <p className="manage-empty">{intro[section].empty}</p>}
        {photos.map((photo, i) => {
          const edit = editing?._id === photo._id ? editing : null;
          return (
          <article key={photo._id} className={`manage-item photo-item${editing?._id === photo._id ? ' editing' : ''}`}>
            <img src={photo.imageUrl} alt="" />
            {edit ? (
              <div className="draft-fields">
                <textarea rows={4} value={edit.caption} onChange={e => setEditing({ ...edit, caption: e.target.value })} />
                <div className="update-form-row">
                  <input placeholder="Date" value={edit.date} onChange={e => setEditing({ ...edit, date: e.target.value })} />
                  <input placeholder="Lieu" value={edit.location} onChange={e => setEditing({ ...edit, location: e.target.value })} />
                </div>
                <div className="form-actions">
                  <button className="gold" onClick={saveEdit}><Check size={15} /> Enregistrer</button>
                  <button className="paper" onClick={() => setEditing(null)}>Annuler</button>
                </div>
              </div>
            ) : (
              <div>
                <small>{[`Photo ${i + 1}`, photo.date, photo.location].filter(Boolean).join(' · ')}</small>
                <p className="photo-caption">{photo.caption}</p>
              </div>
            )}
            <div className="item-actions vertical">
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter"><ArrowUp size={15} /></button>
              <button onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label="Descendre"><ArrowDown size={15} /></button>
              <button onClick={() => setEditing({ ...photo })} aria-label="Modifier le commentaire"><Pencil size={15} /></button>
              <button className="danger" onClick={() => remove(photo)} aria-label="Supprimer"><Trash2 size={15} /></button>
            </div>
          </article>
          );
        })}
      </div>
    </div>
  );
}
