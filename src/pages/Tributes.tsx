import { CSSProperties, FormEvent, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Heart, MapPin, Search, X } from 'lucide-react';
import { Tribute } from '../api';
import { Flower } from '../components/Flower';
import { PrizeEmblem } from '../components/PrizeEmblem';
import { useReveal } from '../hooks';

const delay = (i: number) => ({ '--d': i } as CSSProperties);
const MAX_LENGTH = 3000;
const prompts = ['Un souvenir que je garde d’elle…', 'Ce que Stéphanie m’a appris…', 'Je me souviens de son sourire quand…', 'Chère Stéphanie,'];
const initials = (name: string) => name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();

function TributeCard({ tribute, index }: { tribute: Tribute; index: number }) {
  const [open, setOpen] = useState(false);
  const long = tribute.message.length > 320;
  return (
    <article className="tribute-card" data-reveal style={delay(index % 3)}>
      <Flower className="tribute-flower" />
      <header>
        <span className="tribute-avatar" style={{ '--hue': (tribute.name.length * 37) % 360 } as CSSProperties}>{initials(tribute.name) || '♥'}</span>
        <div>
          <strong>{tribute.name}</strong>
          <span>{tribute.relation || 'Proche'}{tribute.city && <> · <MapPin size={11} /> {tribute.city}</>}</span>
        </div>
      </header>
      <p className={long && !open ? 'clamped' : ''}>{tribute.message}</p>
      {long && <button className="read-more" onClick={() => setOpen(value => !value)}>{open ? 'Réduire' : 'Lire la suite'}</button>}
      <footer><small>{tribute.date}</small><Heart size={14} /></footer>
    </article>
  );
}

export function Tributes({ tributes, onAdd, saving, error, onOpenPrize }: { tributes: Tribute[]; onAdd: (tribute: Tribute) => Promise<void>; saving: boolean; error: string; onOpenPrize: () => void }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<'recent' | 'oldest'>('recent');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', relation: '', message: '', city: '' });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q ? tributes.filter(t => [t.name, t.relation, t.city, t.message].some(value => value?.toLowerCase().includes(q))) : tributes;
    return order === 'recent' ? rows : [...rows].reverse();
  }, [tributes, query, order]);
  const cities = useMemo(() => new Set(tributes.map(t => t.city?.trim().toLowerCase()).filter(Boolean)).size, [tributes]);
  useReveal([filtered.length, query, order]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await onAdd({ ...form, date: new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date()) });
      setForm({ name: '', relation: '', message: '', city: '' });
      setOpen(false);
      setSent(true);
      window.setTimeout(() => setSent(false), 6000);
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Impossible d’enregistrer cet hommage.'); }
  };

  return (
    <main>
      <section className="page-hero tributes-hero">
        <div className="layout">
          <label className="hero-in" style={delay(0)}>Mur des hommages</label>
          <h1 className="hero-in" style={delay(1)}>Des mots d’amour,<br /><em>pour ne jamais oublier.</em></h1>
          <p className="hero-in" style={delay(2)}>Partagez un souvenir, un message ou quelques mots pour Stéphanie et toutes les personnes qui l’aiment.</p>
          <div className="tributes-hero-row hero-in" style={delay(3)}>
            <button className="gold large" onClick={() => setOpen(true)}><Heart size={17} /> Laisser un hommage</button>
            {tributes.length > 0 && (
              <div className="tribute-counters">
                <span><strong>{tributes.length}</strong> {tributes.length > 1 ? 'messages' : 'message'}</span>
                {cities > 0 && <span><strong>{cities}</strong> {cities > 1 ? 'villes' : 'ville'}</span>}
              </div>
            )}
          </div>
          {sent && <p className="form-success"><Check size={15} /> Merci, votre hommage a été publié.</p>}
          {error && <p className="form-error">{error}</p>}
        </div>
      </section>

      <section className="layout">
        <button className="prize-banner" onClick={onOpenPrize} data-reveal>
          <PrizeEmblem size="small" />
          <div>
            <label>Une mémoire qui inspire</label>
            <h2>Prix d’Excellence et de Leadership Kouanhou Stéphanie Donald</h2>
            <p>Institué au Lycée Bilingue de Baleng pour récompenser chaque année les élèves qui allient excellence et sens du service.</p>
          </div>
          <span className="prize-banner-cta">Découvrir le Prix <ArrowRight size={16} /></span>
        </button>
      </section>

      {tributes.length > 0 && (
        <div className="layout tribute-toolbar" data-reveal>
          <div className="search-field">
            <Search size={16} />
            <input type="search" placeholder="Rechercher un nom, une ville, un mot…" value={query} onChange={e => setQuery(e.target.value)} />
            {query && <button onClick={() => setQuery('')} aria-label="Effacer"><X size={14} /></button>}
          </div>
          <div className="segmented">
            <button className={order === 'recent' ? 'active' : ''} onClick={() => setOrder('recent')}>Plus récents</button>
            <button className={order === 'oldest' ? 'active' : ''} onClick={() => setOrder('oldest')}>Plus anciens</button>
          </div>
        </div>
      )}

      <section className="tribute-wall layout">
        {tributes.length === 0 && !error && (
          <div className="tribute-empty" data-reveal>
            <Flower />
            <h3>Le mur attend vos mots.</h3>
            <p>Soyez parmi les premiers à partager un souvenir de Stéphanie.</p>
            <button className="paper" onClick={() => setOpen(true)}><Heart size={15} /> Écrire un hommage</button>
          </div>
        )}
        {tributes.length > 0 && filtered.length === 0 && <p className="manage-empty">Aucun hommage ne correspond à « {query} ».</p>}
        <div className="tribute-masonry">
          {filtered.map((tribute, i) => <TributeCard key={tribute._id || `${tribute.name}-${i}`} tribute={tribute} index={i} />)}
        </div>
      </section>

      {open && (
        <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
          <form className="modal" onSubmit={submit}>
            <button type="button" className="close" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18} /></button>
            <label>Laisser un hommage</label>
            <h2>Quelques mots peuvent tout changer.</h2>
            <input required placeholder="Votre nom *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <div className="update-form-row">
              <input placeholder="Votre lien avec Stéphanie" value={form.relation} onChange={e => setForm({ ...form, relation: e.target.value })} />
              <input placeholder="Ville / pays" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
            {!form.message && (
              <div className="prompt-chips">
                {prompts.map(prompt => <button type="button" key={prompt} onClick={() => setForm({ ...form, message: `${prompt} ` })}>{prompt}</button>)}
              </div>
            )}
            <textarea required rows={6} maxLength={MAX_LENGTH} placeholder="Votre souvenir ou votre message *" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            <small className="char-count">{form.message.length} / {MAX_LENGTH}</small>
            {formError && <p className="notice notice-error"><AlertCircle size={16} /> {formError}</p>}
            <button className="gold" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Publier l’hommage'} <Heart size={15} /></button>
          </form>
        </div>
      )}
    </main>
  );
}
