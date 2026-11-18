import { CSSProperties, FormEvent, useEffect, useState } from 'react';
import { AlertCircle, Flame, X } from 'lucide-react';
import { api, Candle as CandleRow, CandleSummary } from '../api';

const LIT_KEY = 'memorial-candle-lit';
const MAX_SMALL_CANDLES = 21;
const formatDate = (value?: string) => (value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(value)) : '');

export function Candle({ size = 'small', fresh = false, style, title }: { size?: 'small' | 'large' | 'tiny'; fresh?: boolean; style?: CSSProperties; title?: string }) {
  return (
    <div className={`candle candle-${size}${fresh ? ' candle-fresh' : ''}`} style={style} title={title} aria-hidden={!title}>
      <div className="candle-flame"><span /></div>
      <div className="candle-wick" />
      <div className="candle-body" />
    </div>
  );
}

function CandleList({ summary, onClose }: { summary: CandleSummary; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="modal-backdrop candle-list-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal candle-list" role="dialog" aria-modal="true" aria-label="Bougies allumées">
        <button type="button" className="close" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        <label>Une flamme pour elle</label>
        <h2>{summary.count} {summary.count > 1 ? 'bougies allumées' : 'bougie allumée'}</h2>
        <div className="candle-list-grid">
          {summary.candles.map((candle, i) => (
            <article key={candle._id || i} className="candle-entry" style={{ '--d': i % 12 } as CSSProperties}>
              <Candle size="tiny" style={{ animationDelay: `${(i % 7) * -0.37}s` }} />
              <div>
                <strong>{candle.name || 'Une pensée anonyme'}</strong>
                {candle.message && <p>« {candle.message} »</p>}
                <small>{formatDate(candle.createdAt)}</small>
              </div>
            </article>
          ))}
        </div>
        {summary.count > summary.candles.length && <p className="candle-list-more">… et {summary.count - summary.candles.length} autres flammes.</p>}
      </div>
    </div>
  );
}

export type CandleInvite = { name: string; n: number };

function useCandles() {
  const [summary, setSummary] = useState<CandleSummary | null>(null);
  const [lit, setLit] = useState(() => { try { return localStorage.getItem(LIT_KEY) === '1'; } catch { return false; } });
  const [form, setForm] = useState({ name: '', message: '' });
  const [freshId, setFreshId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api<CandleSummary>('/api/memorial/candles').then(setSummary).catch(() => setSummary(null)); }, []);

  const light = async (onDone: () => void) => {
    setBusy(true); setError('');
    try {
      const { candle, count } = await api<{ candle: CandleRow; count: number }>('/api/memorial/candles', { method: 'POST', body: form });
      setSummary(current => ({ count, candles: [candle, ...(current?.candles || [])] }));
      setFreshId(candle._id || '');
      try { localStorage.setItem(LIT_KEY, '1'); } catch { /* storage unavailable */ }
      setLit(true); setForm({ name: '', message: '' }); onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’allumer la bougie.');
    } finally { setBusy(false); }
  };

  return { summary, lit, form, setForm, freshId, setFreshId, busy, error, light };
}

function CandleStage({ summary, freshId, onShowAll }: { summary: CandleSummary | null; freshId: string; onShowAll: () => void }) {
  const candles = summary?.candles || [];
  const shown = candles.slice(0, MAX_SMALL_CANDLES).reverse();
  const count = summary?.count ?? 0;
  return (
    <div className="candle-stage">
      <div className="candle-glow" />
      <Candle size="large" />
      <div className="candle-row">
        {shown.map((candle, i) => (
          <Candle key={candle._id || i} fresh={candle._id === freshId} title={candle.name || 'Une pensée anonyme'} style={{ animationDelay: `${(i % 7) * -0.37}s` }} />
        ))}
        {count > MAX_SMALL_CANDLES && <button className="candle-more" onClick={onShowAll}>+{count - MAX_SMALL_CANDLES}</button>}
      </div>
    </div>
  );
}

function CountLink({ count, onClick }: { count: number; onClick: () => void }) {
  if (count <= 0) return null;
  return (
    <button className="candle-count" onClick={onClick}>
      <strong>{count}</strong> {count > 1 ? 'bougies allumées' : 'bougie allumée'} · <u>Voir toutes</u>
    </button>
  );
}

export function CandleWall({ name }: { name: string }) {
  const c = useCandles();
  const [formOpen, setFormOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const count = c.summary?.count ?? 0;

  return (
    <section className="candle-section" id="bougies">
      <div className="layout candle-layout">
        <div data-reveal>
          <label>Une flamme pour elle</label>
          <h2>Allumez une bougie en mémoire de Stéphanie.</h2>
          <p>Chaque flamme est une pensée, une prière ou un souvenir offert à {name}. Ensemble, elles gardent sa lumière vivante.</p>

          {formOpen ? (
            <form className="candle-form" onSubmit={e => { e.preventDefault(); c.light(() => setFormOpen(false)); }}>
              <input placeholder="Votre nom (facultatif)" maxLength={80} value={c.form.name} onChange={e => c.setForm({ ...c.form, name: e.target.value })} />
              <input placeholder="Une pensée, une prière… (facultatif)" maxLength={180} value={c.form.message} onChange={e => c.setForm({ ...c.form, message: e.target.value })} />
              {c.error && <p className="notice notice-error"><AlertCircle size={16} /> {c.error}</p>}
              <div className="candle-actions">
                <button className="gold" type="submit" disabled={c.busy}><Flame size={16} /> {c.busy ? 'Allumage…' : 'Allumer ma bougie'}</button>
                <button className="paper" type="button" onClick={() => setFormOpen(false)}>Annuler</button>
              </div>
            </form>
          ) : (
            <div className="candle-actions">
              <button className="gold large" onClick={() => setFormOpen(true)}>
                <Flame size={17} /> {c.lit ? 'Allumer une autre bougie' : 'Allumer une bougie'}
              </button>
              <CountLink count={count} onClick={() => setListOpen(true)} />
            </div>
          )}
          {c.lit && c.freshId && <p className="candle-thanks">Merci. Votre flamme brille désormais avec les autres.</p>}
        </div>
        <div data-reveal><CandleStage summary={c.summary} freshId={c.freshId} onShowAll={() => setListOpen(true)} /></div>
      </div>
      {listOpen && c.summary && <CandleList summary={c.summary} onClose={() => setListOpen(false)} />}
    </section>
  );
}

/** Compact candle for a page hero: the stage + count, with the lighting form in a modal opened via `invite`. */
export function HeroCandle({ invite }: { invite: CandleInvite | null }) {
  const c = useCandles();
  const { setForm, setFreshId } = c;
  const [formOpen, setFormOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const fromTribute = Boolean(invite?.name);

  useEffect(() => {
    if (!invite) return;
    setForm(current => ({ ...current, name: current.name || invite.name }));
    setFreshId('');
    setFormOpen(true);
  }, [invite, setForm, setFreshId]);

  useEffect(() => {
    if (!formOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setFormOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [formOpen]);

  return (
    <div className="hero-candle">
      <CandleStage summary={c.summary} freshId={c.freshId} onShowAll={() => setListOpen(true)} />
      <CountLink count={c.summary?.count ?? 0} onClick={() => setListOpen(true)} />
      {c.lit && c.freshId && <p className="candle-thanks">Merci. Votre flamme brille désormais avec les autres.</p>}

      {formOpen && (
        <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setFormOpen(false); }}>
          <form className="modal" onSubmit={e => { e.preventDefault(); c.light(() => setFormOpen(false)); }}>
            <button type="button" className="close" onClick={() => setFormOpen(false)} aria-label="Fermer"><X size={18} /></button>
            <label>Une flamme pour elle</label>
            <h2>{fromTribute ? 'Merci pour votre hommage.' : 'Allumez une bougie.'}</h2>
            <p className="modal-lead">{fromTribute ? 'Prolongez-le en allumant une bougie en mémoire de Stéphanie.' : 'Chaque flamme est une pensée, une prière ou un souvenir offert à Stéphanie.'}</p>
            <input placeholder="Votre nom (facultatif)" maxLength={80} value={c.form.name} onChange={e => c.setForm({ ...c.form, name: e.target.value })} />
            <input autoFocus placeholder="Une pensée, une prière… (facultatif)" maxLength={180} value={c.form.message} onChange={e => c.setForm({ ...c.form, message: e.target.value })} />
            {c.error && <p className="notice notice-error"><AlertCircle size={16} /> {c.error}</p>}
            <button className="gold" type="submit" disabled={c.busy}><Flame size={16} /> {c.busy ? 'Allumage…' : 'Allumer ma bougie'}</button>
            {fromTribute && <button className="paper" type="button" onClick={() => setFormOpen(false)}>Plus tard</button>}
          </form>
        </div>
      )}
      {listOpen && c.summary && <CandleList summary={c.summary} onClose={() => setListOpen(false)} />}
    </div>
  );
}
