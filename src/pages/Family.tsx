import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AlertCircle, Award, Camera, Check, Eye, EyeOff, Flame, ImagePlus, KeyRound, LayoutDashboard, Loader2, LogOut, MapPin, MessageCircle, Newspaper, Pencil, Plus, Trash2, X } from 'lucide-react';
import { api, Candle, CandleSummary, compressImage, Laureate, MemorialUpdate, Photo, session, Tribute } from '../api';
import { PhotoManager } from './PhotoManager';
import { Flower } from '../components/Flower';

type Tab = 'overview' | 'photos' | 'updates' | 'tributes' | 'candles' | 'laureates';
type Notice = { kind: 'success' | 'error'; text: string } | null;

const emptyUpdate: MemorialUpdate = { title: '', date: '', location: '', description: '', imageUrl: '' };
const emptyLaureate: Laureate = { name: '', year: String(new Date().getFullYear()), className: '', distinction: 'Lauréat·e du Prix', note: '', imageUrl: '' };
const message = (error: unknown) => (error instanceof Error ? error.message : 'Une erreur est survenue.');

/* ---------- Login ---------- */

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const { token } = await api<{ token: string }>('/api/memorial/admin/login', { method: 'POST', body: { password } });
      session.set(token);
      onSuccess();
    } catch (err) { setError(message(err)); } finally { setBusy(false); }
  };
  return (
    <main className="family-login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-icon"><KeyRound size={24} /></div>
        <label>Espace famille</label>
        <h1>Accès réservé à la famille</h1>
        <p>Cet espace permet de gérer les actualités, les hommages et les lauréats du Prix. Saisissez le mot de passe communiqué par la famille.</p>
        <div className="password-field">
          <input type={show ? 'text' : 'password'} autoFocus required autoComplete="current-password" placeholder="Mot de passe" value={password} onChange={event => setPassword(event.target.value)} />
          <button type="button" onClick={() => setShow(value => !value)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        </div>
        {error && <p className="notice notice-error"><AlertCircle size={16} /> {error}</p>}
        <button className="gold large" type="submit" disabled={busy}>{busy ? <><Loader2 size={16} className="spin" /> Vérification…</> : <>Entrer <KeyRound size={16} /></>}</button>
      </form>
    </main>
  );
}

/* ---------- Image picker (upload or URL) ---------- */

function ImageField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError('');
    try { onChange(await compressImage(file)); } catch (err) { setError(message(err)); } finally { setBusy(false); }
  };
  return (
    <div className="image-field">
      {value ? (
        <div className="image-preview"><img src={value} alt="Aperçu" /><button type="button" onClick={() => onChange('')} aria-label="Retirer l’image"><X size={16} /></button></div>
      ) : (
        <label className="image-drop">
          <input type="file" accept="image/*" onChange={event => pick(event.target.files?.[0])} />
          {busy ? <Loader2 size={22} className="spin" /> : <ImagePlus size={22} />}
          <span>{busy ? 'Préparation de l’image…' : 'Ajouter une image (programme, plan, photo)'}</span>
        </label>
      )}
      {!value.startsWith('data:') && (
        <input placeholder="…ou coller l’adresse (URL) d’une image" value={value} onChange={event => onChange(event.target.value)} />
      )}
      {error && <p className="notice notice-error"><AlertCircle size={16} /> {error}</p>}
    </div>
  );
}

/* ---------- Dashboard ---------- */

export function Family({ onDataChanged, onLeave }: { onDataChanged: () => void; onLeave: () => void }) {
  const [authed, setAuthed] = useState(() => Boolean(session.get()));
  const [tab, setTab] = useState<Tab>('overview');
  const [notice, setNotice] = useState<Notice>(null);
  const [updates, setUpdates] = useState<MemorialUpdate[]>([]);
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [laureates, setLaureates] = useState<Laureate[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [candleCount, setCandleCount] = useState<number | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);

  const [updateForm, setUpdateForm] = useState<MemorialUpdate>(emptyUpdate);
  const [laureateForm, setLaureateForm] = useState<Laureate>(emptyLaureate);
  const [saving, setSaving] = useState(false);

  const handleError = useCallback((error: unknown) => {
    if (!session.get()) setAuthed(false);
    setNotice({ kind: 'error', text: message(error) });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, t, l, p, c] = await Promise.all([
        api<MemorialUpdate[]>('/api/memorial/updates'),
        api<Tribute[]>('/api/memorial/admin/tributes', { auth: true }),
        api<Laureate[]>('/api/memorial/laureates'),
        api<Photo[]>('/api/memorial/photos'),
        api<CandleSummary>('/api/memorial/candles'),
      ]);
      setUpdates(u); setTributes(t); setLaureates(l); setPhotos(p); setCandles(c.candles); setCandleCount(c.count);
    } catch (error) { handleError(error); } finally { setLoading(false); }
  }, [handleError]);

  useEffect(() => { if (authed) load(); }, [authed, load]);
  useEffect(() => {
    if (!notice || notice.kind === 'error') return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  const done = (text: string) => { setNotice({ kind: 'success', text }); onDataChanged(); };
  const logout = () => { session.clear(); setAuthed(false); onLeave(); };

  /* Updates */
  const saveUpdate = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setNotice(null);
    try {
      const { _id, ...body } = updateForm;
      if (_id) {
        const saved = await api<MemorialUpdate>(`/api/memorial/updates/${_id}`, { method: 'PUT', body, auth: true });
        setUpdates(current => current.map(row => (row._id === _id ? saved : row)));
        done('Actualité modifiée.');
      } else {
        const saved = await api<MemorialUpdate>('/api/memorial/updates', { method: 'POST', body, auth: true });
        setUpdates(current => [saved, ...current]);
        done('Actualité publiée sur le site.');
      }
      setUpdateForm(emptyUpdate);
    } catch (error) { handleError(error); } finally { setSaving(false); }
  };
  const deleteUpdate = async (row: MemorialUpdate) => {
    if (!row._id || !window.confirm(`Supprimer définitivement « ${row.title} » ?`)) return;
    try { await api(`/api/memorial/updates/${row._id}`, { method: 'DELETE', auth: true }); setUpdates(current => current.filter(item => item._id !== row._id)); done('Actualité supprimée.'); }
    catch (error) { handleError(error); }
  };

  /* Tributes */
  const toggleTribute = async (row: Tribute) => {
    if (!row._id) return;
    const status = row.status === 'hidden' ? 'published' : 'hidden';
    try { const saved = await api<Tribute>(`/api/memorial/tributes/${row._id}`, { method: 'PATCH', body: { status }, auth: true }); setTributes(current => current.map(item => (item._id === row._id ? saved : item))); done(status === 'hidden' ? 'Hommage masqué du site.' : 'Hommage de nouveau visible.'); }
    catch (error) { handleError(error); }
  };
  const deleteTribute = async (row: Tribute) => {
    if (!row._id || !window.confirm(`Supprimer définitivement l’hommage de ${row.name} ?`)) return;
    try { await api(`/api/memorial/tributes/${row._id}`, { method: 'DELETE', auth: true }); setTributes(current => current.filter(item => item._id !== row._id)); done('Hommage supprimé.'); }
    catch (error) { handleError(error); }
  };

  /* Candles */
  const deleteCandle = async (row: Candle) => {
    if (!row._id || !window.confirm('Supprimer cette bougie et son message ?')) return;
    try { await api(`/api/memorial/candles/${row._id}`, { method: 'DELETE', auth: true }); setCandles(current => current.filter(item => item._id !== row._id)); setCandleCount(n => (n === null ? n : n - 1)); done('Bougie supprimée.'); }
    catch (error) { handleError(error); }
  };

  /* Laureates */
  const saveLaureate = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setNotice(null);
    try {
      const { _id, ...body } = laureateForm;
      if (_id) {
        const saved = await api<Laureate>(`/api/memorial/laureates/${_id}`, { method: 'PUT', body, auth: true });
        setLaureates(current => current.map(row => (row._id === _id ? saved : row)));
        done('Lauréat modifié.');
      } else {
        const saved = await api<Laureate>('/api/memorial/laureates', { method: 'POST', body, auth: true });
        setLaureates(current => [saved, ...current]);
        done('Lauréat ajouté au palmarès.');
      }
      setLaureateForm(emptyLaureate);
    } catch (error) { handleError(error); } finally { setSaving(false); }
  };
  const deleteLaureate = async (row: Laureate) => {
    if (!row._id || !window.confirm(`Retirer ${row.name} du palmarès ?`)) return;
    try { await api(`/api/memorial/laureates/${row._id}`, { method: 'DELETE', auth: true }); setLaureates(current => current.filter(item => item._id !== row._id)); done('Lauréat retiré.'); }
    catch (error) { handleError(error); }
  };

  const published = tributes.filter(t => t.status !== 'hidden').length;
  const tabs: [Tab, string, typeof Newspaper, number | null][] = [
    ['overview', 'Aperçu', LayoutDashboard, null],
    ['photos', 'Photos commentées', Camera, photos.length],
    ['updates', 'Actualités', Newspaper, updates.length],
    ['tributes', 'Hommages', MessageCircle, tributes.length],
    ['candles', 'Bougies', Flame, candleCount],
    ['laureates', 'Lauréats du Prix', Award, laureates.length],
  ];

  return (
    <main className="family-dashboard">
      <section className="dashboard-head layout">
        <div>
          <label><KeyRound size={13} /> Espace famille</label>
          <h1>Garder la mémoire vivante.</h1>
          <p>Gérez ici ce qui est visible sur le site. Les modifications sont publiées immédiatement.</p>
        </div>
        <button className="paper" onClick={logout}><LogOut size={15} /> Se déconnecter</button>
      </section>

      <div className="layout">
        <nav className="dashboard-tabs" role="tablist">
          {tabs.map(([id, label, Icon, count]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setNotice(null); }}>
              <Icon size={16} /> {label}{count !== null && <span>{count}</span>}
            </button>
          ))}
        </nav>
        {notice && (
          <div className={`notice notice-${notice.kind}`} role="status">
            {notice.kind === 'success' ? <Check size={16} /> : <AlertCircle size={16} />} {notice.text}
            <button onClick={() => setNotice(null)} aria-label="Fermer"><X size={14} /></button>
          </div>
        )}
        {loading && <p className="dashboard-loading"><Loader2 size={16} className="spin" /> Chargement…</p>}
      </div>

      <section className="dashboard-body layout">
        {tab === 'overview' && (
          <div className="overview-grid">
            {[
              [MessageCircle, published, 'hommages publiés', `${tributes.length - published} masqué(s)`, 'tributes'],
              [Newspaper, updates.length, 'actualités en ligne', 'Programme, lieux, annonces', 'updates'],
              [Award, laureates.length, 'lauréats au palmarès', 'Prix d’Excellence et de Leadership', 'laureates'],
              [Camera, photos.length, 'photos commentées', 'Souvenirs racontés', 'photos'],
              [Flame, candleCount ?? '—', 'bougies allumées', 'Par les visiteurs du site', 'candles'],
            ].map(([Icon, value, label, hint, target]) => {
              const I = Icon as typeof Flame;
              return (
                <button key={label as string} className="overview-card" disabled={!target} onClick={() => target && setTab(target as Tab)}>
                  <I size={20} /><strong>{value as number}</strong><span>{label as string}</span><small>{hint as string}</small>
                </button>
              );
            })}
            <div className="overview-help">
              <Flower />
              <div>
                <h3>Que puis-je faire ici ?</h3>
                <ul>
                  <li><b>Photos commentées</b> : ajouter des photos avec le texte qui raconte leur histoire.</li>
                  <li><b>Actualités</b> : annoncer une veillée, une messe, un lieu, avec une image du programme ou du plan.</li>
                  <li><b>Hommages</b> et <b>Bougies</b> : masquer ou supprimer un message inapproprié.</li>
                  <li><b>Lauréats</b> : ajouter chaque année les élèves récompensés par le Prix.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab === 'photos' && <PhotoManager photos={photos} setPhotos={setPhotos} onDone={done} onError={handleError} />}

        {tab === 'candles' && (
          <div className="manage-list wide">
            {candles.length === 0 && <p className="manage-empty">Aucune bougie allumée pour le moment.</p>}
            {candles.map(row => (
              <article key={row._id} className="manage-item">
                <div>
                  <small>{row.createdAt ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(row.createdAt)) : ''}</small>
                  <h3>{row.name || 'Anonyme'}</h3>
                  {row.message && <p>{row.message}</p>}
                </div>
                <div className="item-actions"><button className="danger" onClick={() => deleteCandle(row)} aria-label="Supprimer"><Trash2 size={15} /></button></div>
              </article>
            ))}
          </div>
        )}

        {tab === 'updates' && (
          <div className="manage-grid">
            <form className="admin-card manage-form" onSubmit={saveUpdate}>
              <label>{updateForm._id ? 'Modifier l’actualité' : 'Nouvelle actualité'}</label>
              <h2>{updateForm._id ? updateForm.title || 'Modification' : 'Programme, lieu ou annonce'}</h2>
              <input required placeholder="Titre *" value={updateForm.title} onChange={e => setUpdateForm({ ...updateForm, title: e.target.value })} />
              <div className="update-form-row">
                <input type="date" aria-label="Date" value={updateForm.date} onChange={e => setUpdateForm({ ...updateForm, date: e.target.value })} />
                <input placeholder="Lieu ou adresse" value={updateForm.location} onChange={e => setUpdateForm({ ...updateForm, location: e.target.value })} />
              </div>
              <textarea required rows={5} placeholder="Description, programme ou consignes *" value={updateForm.description} onChange={e => setUpdateForm({ ...updateForm, description: e.target.value })} />
              <ImageField value={updateForm.imageUrl} onChange={imageUrl => setUpdateForm({ ...updateForm, imageUrl })} />
              <div className="form-actions">
                <button className="gold" type="submit" disabled={saving}>{saving ? <><Loader2 size={15} className="spin" /> Enregistrement…</> : updateForm._id ? <><Check size={15} /> Enregistrer</> : <><Plus size={15} /> Publier</>}</button>
                {updateForm._id && <button type="button" className="paper" onClick={() => setUpdateForm(emptyUpdate)}>Annuler</button>}
              </div>
            </form>
            <div className="manage-list">
              {updates.length === 0 && <p className="manage-empty">Aucune actualité publiée pour le moment.</p>}
              {updates.map(row => (
                <article key={row._id} className={`manage-item${updateForm._id === row._id ? ' editing' : ''}`}>
                  {row.imageUrl && <img src={row.imageUrl} alt="" />}
                  <div>
                    <small>{row.date || 'Sans date'}{row.location && <> · <MapPin size={11} /> {row.location}</>}</small>
                    <h3>{row.title}</h3>
                    <p>{row.description}</p>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => { setUpdateForm({ ...emptyUpdate, ...row }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Modifier"><Pencil size={15} /></button>
                    <button className="danger" onClick={() => deleteUpdate(row)} aria-label="Supprimer"><Trash2 size={15} /></button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === 'tributes' && (
          <div className="manage-list wide">
            {tributes.length === 0 && <p className="manage-empty">Aucun hommage pour le moment.</p>}
            {tributes.map(row => (
              <article key={row._id} className={`manage-item${row.status === 'hidden' ? ' is-hidden' : ''}`}>
                <div>
                  <small>{row.date} · {row.relation || 'Proche'} · {row.city || '—'} {row.status === 'hidden' && <span className="badge">Masqué</span>}</small>
                  <h3>{row.name}</h3>
                  <p>{row.message}</p>
                </div>
                <div className="item-actions">
                  <button onClick={() => toggleTribute(row)} aria-label={row.status === 'hidden' ? 'Publier' : 'Masquer'} title={row.status === 'hidden' ? 'Rendre visible' : 'Masquer du site'}>{row.status === 'hidden' ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                  <button className="danger" onClick={() => deleteTribute(row)} aria-label="Supprimer"><Trash2 size={15} /></button>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === 'laureates' && (
          <div className="manage-grid">
            <form className="admin-card manage-form" onSubmit={saveLaureate}>
              <label>{laureateForm._id ? 'Modifier' : 'Ajouter au palmarès'}</label>
              <h2>Lauréat du Prix</h2>
              <input required placeholder="Nom et prénom *" value={laureateForm.name} onChange={e => setLaureateForm({ ...laureateForm, name: e.target.value })} />
              <div className="update-form-row">
                <input required placeholder="Année scolaire * (ex. 2026-2027)" value={laureateForm.year} onChange={e => setLaureateForm({ ...laureateForm, year: e.target.value })} />
                <input placeholder="Classe (ex. Terminale C)" value={laureateForm.className} onChange={e => setLaureateForm({ ...laureateForm, className: e.target.value })} />
              </div>
              <select value={laureateForm.distinction} onChange={e => setLaureateForm({ ...laureateForm, distinction: e.target.value })}>
                <option>Lauréat·e du Prix</option>
                <option>Mention spéciale « Inspiration Kouanhou »</option>
                <option>Mention spéciale — Leadership</option>
                <option>Lot secondaire</option>
              </select>
              <textarea rows={3} placeholder="Quelques mots (moyenne, parcours, citation…)" value={laureateForm.note} onChange={e => setLaureateForm({ ...laureateForm, note: e.target.value })} />
              <ImageField value={laureateForm.imageUrl} onChange={imageUrl => setLaureateForm({ ...laureateForm, imageUrl })} />
              <div className="form-actions">
                <button className="gold" type="submit" disabled={saving}>{saving ? <><Loader2 size={15} className="spin" /> Enregistrement…</> : laureateForm._id ? <><Check size={15} /> Enregistrer</> : <><Plus size={15} /> Ajouter</>}</button>
                {laureateForm._id && <button type="button" className="paper" onClick={() => setLaureateForm(emptyLaureate)}>Annuler</button>}
              </div>
            </form>
            <div className="manage-list">
              {laureates.length === 0 && <p className="manage-empty">Le palmarès est vide. Les lauréats ajoutés ici apparaissent sur la page du Prix.</p>}
              {laureates.map(row => (
                <article key={row._id} className={`manage-item${laureateForm._id === row._id ? ' editing' : ''}`}>
                  {row.imageUrl && <img src={row.imageUrl} alt="" />}
                  <div><small>{row.year} · {row.className || '—'}</small><h3>{row.name}</h3><p>{row.distinction}</p></div>
                  <div className="item-actions">
                    <button onClick={() => { setLaureateForm({ ...emptyLaureate, ...row }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Modifier"><Pencil size={15} /></button>
                    <button className="danger" onClick={() => deleteLaureate(row)} aria-label="Supprimer"><Trash2 size={15} /></button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
