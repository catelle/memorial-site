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

export function CandleWall({ name, invite }: { name: string; invite?: CandleInvite | null }) {
  const [summary, setSummary] = useState<CandleSummary | null>(null);
  const [lit, setLit] = useState(() => { try { return localStorage.getItem(LIT_KEY) === '1'; } catch { return false; } });
  const [formOpen, setFormOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [form, setForm] = useState({ name: '', message: '' });
  const [freshId, setFreshId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api<CandleSummary>('/api/memorial/candles').then(setSummary).catch(() => setSummary(null)); }, []);
  useEffect(() => {
    if (!invite) return;
    setForm(current => ({ ...current, name: current.name || invite.name }));
    setFreshId('');
    setFormOpen(true);
  }, [invite?.n]);

  const light = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const { candle, count } = await api<{ candle: CandleRow; count: number }>('/api/memorial/candles', { method: 'POST', body: form });
      setSummary(current => ({ count, candles: [candle, ...(current?.candles || [])] }));
      setFreshId(candle._id || '');
      try { localStorage.setItem(LIT_KEY, '1'); } catch { /* storage unavailable */ }
      setLit(true); setFormOpen(false); setForm({ name: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’allumer la bougie.');
    } finally { setBusy(false); }
  };

  const candles = summary?.candles || [];
  const shown = candles.slice(0, MAX_SMALL_CANDLES).reverse();
  const count = summary?.count ?? 0;

  return (
    <section className="candle-section" id="bougies">
      <div className="layout candle-layout">
        <div data-reveal>
          <label>Une flamme pour elle</label>
          <h2>Allumez une bougie en mémoire de Stéphanie.</h2>
          {invite && formOpen && <p className="candle-thanks">Merci pour votre hommage. Prolongez-le en allumant une bougie pour Stéphanie.</p>}
          <p>Chaque flamme est une pensée, une prière ou un souvenir offert à {name}. Ensemble, elles gardent sa lumière vivante.</p>

          {formOpen ? (
            <form className="candle-form" onSubmit={light}>
              <input placeholder="Votre nom (facultatif)" maxLength={80} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Une pensée, une prière… (facultatif)" maxLength={180} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              {error && <p className="notice notice-error"><AlertCircle size={16} /> {error}</p>}
              <div className="candle-actions">
                <button className="gold" type="submit" disabled={busy}><Flame size={16} /> {busy ? 'Allumage…' : 'Allumer ma bougie'}</button>
                <button className="paper" type="button" onClick={() => setFormOpen(false)}>Annuler</button>
              </div>
            </form>
          ) : (
            <div className="candle-actions">
              <button className="gold large" onClick={() => setFormOpen(true)}>
                <Flame size={17} /> {lit ? 'Allumer une autre bougie' : 'Allumer une bougie'}
              </button>
              {count > 0 && (
                <button className="candle-count" onClick={() => setListOpen(true)}>
                  <strong>{count}</strong> {count > 1 ? 'bougies allumées' : 'bougie allumée'} · <u>Voir toutes</u>
                </button>
              )}
            </div>
          )}
          {lit && freshId && <p className="candle-thanks">Merci. Votre flamme brille désormais avec les autres.</p>}
        </div>
        <div className="candle-stage" data-reveal>
          <div className="candle-glow" />
          <Candle size="large" />
          <div className="candle-row">
            {shown.map((candle, i) => (
              <Candle key={candle._id || i} fresh={candle._id === freshId} title={candle.name || 'Une pensée anonyme'} style={{ animationDelay: `${(i % 7) * -0.37}s` }} />
            ))}
            {count > MAX_SMALL_CANDLES && <button className="candle-more" onClick={() => setListOpen(true)}>+{count - MAX_SMALL_CANDLES}</button>}
          </div>
        </div>
      </div>
      {listOpen && summary && <CandleList summary={summary} onClose={() => setListOpen(false)} />}
    </section>
  );
}
