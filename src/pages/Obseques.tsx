import { CSSProperties, useEffect, useState } from 'react';
import { ArrowRight, CalendarPlus, Check, Clock, Flame, Heart, MapPin, Navigation } from 'lucide-react';
import { announcingFamilies, calendarFile, deathNotice, eventEnd, eventTime, funeralProgramme, FuneralEvent, mapLink, nextFuneralEvent } from '../data/obseques';
import { Divider, Flower } from '../components/Flower';
import { useReveal } from '../hooks';

const delay = (i: number) => ({ '--d': i } as CSSProperties);

/** Re-renders every minute so statuses and the countdown stay current. */
function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), intervalMs); return () => window.clearInterval(timer); }, [intervalMs]);
  return now;
}

function countdown(target: Date, now: Date) {
  const ms = Math.max(0, target.getTime() - now.getTime());
  return { days: Math.floor(ms / 86_400_000), hours: Math.floor((ms % 86_400_000) / 3_600_000), minutes: Math.floor((ms % 3_600_000) / 60_000), started: ms === 0 };
}

/** Slim banner for the home page announcing the next step of the funeral programme. */
export function NextEventBanner({ onOpen }: { onOpen: () => void }) {
  const now = useNow();
  const next = nextFuneralEvent(now);
  if (!next) return null;
  const { days, started } = countdown(eventTime(next), now);
  const when = started ? 'Aujourd’hui' : days === 0 ? 'Demain' : `Dans ${days} jour${days > 1 ? 's' : ''}`;
  return (
    <button className="next-event-banner" onClick={onOpen}>
      <span className="next-event-pill"><Clock size={13} /> {when}</span>
      <span className="next-event-text"><b>{next.title}</b> · {next.dayLabel}{next.start ? `, ${next.start.replace(':', 'h')}` : ''} · {next.place}</span>
      <span className="next-event-cta">Programme des obsèques <ArrowRight size={14} /></span>
    </button>
  );
}

function EventCard({ event, status, index }: { event: FuneralEvent; status: 'past' | 'next' | 'upcoming'; index: number }) {
  const [weekday, ...rest] = event.dayLabel.split(' ');
  const [dayNumber, month] = rest;
  return (
    <li className={`funeral-event is-${status}`} data-reveal style={delay(index)}>
      <div className="funeral-marker">{status === 'past' ? <Check size={16} /> : <Flower />}</div>
      <div className="funeral-date"><span>{weekday}</span><strong>{dayNumber}</strong><span>{month}</span></div>
      <div className="funeral-body">
        <div className="funeral-tags">
          <span className="funeral-stage">{event.stage}</span>
          {status === 'past' && <span className="funeral-status">Accompli</span>}
          {status === 'next' && <span className="funeral-status next">Prochaine étape</span>}
        </div>
        <h3>{event.title}</h3>
        <p className="funeral-place"><MapPin size={14} /> {event.place}</p>
        {event.schedule && (
          <ol className="funeral-schedule">
            {event.schedule.map(item => <li key={item.time + item.label}><time>{item.time}</time><span>{item.label}</span></li>)}
          </ol>
        )}
        {status !== 'past' && (
          <div className="funeral-actions">
            <a className="paper" href={calendarFile(event)} download={`${event.id}.ics`}><CalendarPlus size={15} /> Ajouter à mon agenda</a>
            {event.mapQuery && <a className="paper" href={mapLink(event.mapQuery)} target="_blank" rel="noreferrer"><Navigation size={15} /> Itinéraire</a>}
          </div>
        )}
      </div>
    </li>
  );
}

export function Obseques({ onNavigate }: { onNavigate: (target: 'tributes' | 'candles') => void }) {
  const now = useNow();
  const next = nextFuneralEvent(now);
  useReveal([]);
  const time = next ? countdown(eventTime(next), now) : null;

  return (
    <main className="obseques-page">
      <section className="obseques-hero">
        <div className="layout obseques-hero-inner">
          <label className="hero-in" style={delay(0)}>Faire-part</label>
          <h1 className="hero-in" style={delay(1)}>KOUANHOU<br /><em>Stéphanie Donald</em></h1>
          <p className="obseques-dates hero-in" style={delay(2)}>12 décembre 1996 <Flower /> {deathNotice.date}</p>
          <p className="obseques-notice hero-in" style={delay(3)}>{deathNotice.text}</p>
          <p className="obseques-rip hero-in" style={delay(4)}>Repose en paix.</p>
        </div>
      </section>

      {next && time && (
        <section className="layout">
          <div className="countdown-card" data-reveal>
            <div>
              <label>Prochaine étape</label>
              <h2>{next.title}</h2>
              <p><b>{next.dayLabel}{next.start ? ` · ${next.start.replace(':', 'h')}` : ''}</b><br />{next.place}</p>
            </div>
            {time.started ? (
              <div className="countdown-today">Aujourd’hui</div>
            ) : (
              <div className="countdown-grid" aria-label={`Dans ${time.days} jours et ${time.hours} heures`}>
                <div><strong>{time.days}</strong><span>jour{time.days > 1 ? 's' : ''}</span></div>
                <div><strong>{time.hours}</strong><span>heure{time.hours > 1 ? 's' : ''}</span></div>
                <div><strong>{time.minutes}</strong><span>min</span></div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="funeral-programme layout">
        <div className="section-heading" data-reveal><div><label>Programme des obsèques</label><h2>Accompagner Stéphanie jusqu’à Babouantou.</h2></div></div>
        <ol className="funeral-timeline">
          {funeralProgramme.map((event, i) => {
            const status = eventEnd(event) < now ? 'past' : event.id === next?.id ? 'next' : 'upcoming';
            return <EventCard key={event.id} event={event} status={status} index={i} />;
          })}
        </ol>
        <p className="funeral-note" data-reveal>Les heures indiquées sont celles du lieu de chaque cérémonie. Pour toute question, la famille reste joignable via la page Contact.</p>
      </section>

      <section className="families-section">
        <div className="layout">
          <div className="families-head" data-reveal>
            <Divider />
            <label>Les familles en deuil</label>
            <h2>Ils annoncent son départ.</h2>
          </div>
          <ul className="families-list">
            {announcingFamilies.map((family, i) => <li key={family} data-reveal style={delay(i % 4)}><Flower />{family}</li>)}
          </ul>
        </div>
      </section>

      <section className="obseques-close layout" data-reveal>
        <p className="obseques-rip">Que son âme repose en paix.</p>
        <div className="hero-actions">
          <button className="gold large" onClick={() => onNavigate('candles')}><Flame size={17} /> Allumer une bougie</button>
          <button className="paper large" onClick={() => onNavigate('tributes')}><Heart size={17} /> Laisser un hommage</button>
        </div>
      </section>
    </main>
  );
}
