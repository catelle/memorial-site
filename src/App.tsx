import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUp, CalendarDays, Check, ChevronRight, Download, Heart, Lock, MapPin, Menu, MessageCircle, Moon, Share2, Sun, X } from 'lucide-react';
import { api, MemorialUpdate, Tribute } from './api';
import { Lightbox } from './components/Lightbox';
import { Prix } from './pages/Prix';
import { Tributes } from './pages/Tributes';
import { Family } from './pages/Family';
import { useReveal, useTheme } from './hooks';
import { HeroSlideshow } from './components/HeroSlideshow';
import { Petals } from './components/Petals';
import { CountUp } from './components/CountUp';
import { CandleWall } from './components/CandleWall';
import { StoryPhotos } from './components/StoryPhotos';
import { Divider, Flower } from './components/Flower';

type View = 'memory' | 'programme' | 'prix' | 'tributes' | 'family' | 'contact';
type NavTarget = View | 'gallery';

/* Each view has its own URL so pages can be shared and the family space lives at /famille. */
const paths: Record<View, string> = { memory: '/', programme: '/parcours', prix: '/prix', tributes: '/hommages', contact: '/contact', family: '/famille' };
const viewFromPath = (pathname: string): View => {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return (Object.entries(paths).find(([, path]) => path === clean)?.[0] as View) || 'memory';
};

const photo = (n: number) => `/memories/photo-${String(n).padStart(2, '0')}.jpg`;
const galleryImages = Array.from({ length: 42 }, (_, i) => photo(i + 1));
const heroPortraits = [3, 8, 29, 42, 14, 22, 9, 11].map(photo);
const profile = { name: 'KOUANHOU Stéphanie Donald', birth: 'Née le 12 décembre 1996', email: 'stephaniekouanhou@gmail.com' };
const delay = (i: number) => ({ '--d': i } as CSSProperties);

/* ---------- Chrome: header, progress, back-to-top, toast ---------- */

function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.current?.style.setProperty('--progress', String(max > 0 ? window.scrollY / max : 0));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame); };
  }, []);
  return <div className="scroll-progress" ref={bar} aria-hidden="true" />;
}

function useScrolled(threshold: number) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

function BackToTop() {
  const visible = useScrolled(700);
  return (
    <button className={`back-to-top${visible ? ' visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Revenir en haut de la page">
      <ArrowUp size={18} />
    </button>
  );
}

function ThemeToggle({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  const dark = theme === 'dark';
  return (
    <button className="theme-toggle" onClick={onToggle} aria-label={dark ? 'Passer au thème clair' : 'Passer au thème sombre'} title={dark ? 'Thème clair' : 'Thème sombre'}>
      <span className="theme-toggle-track"><span className="theme-toggle-thumb">{dark ? <Moon size={13} /> : <Sun size={13} />}</span></span>
    </button>
  );
}

const navLinks: [NavTarget, string][] = [['memory', 'Sa vie'], ['programme', 'Parcours'], ['gallery', 'Galerie'], ['prix', 'Le Prix'], ['tributes', 'Hommages']];

function Header({ view, onNavigate, onMenu, onShare, theme, onToggleTheme }: { view: View; onNavigate: (target: NavTarget) => void; onMenu: () => void; onShare: () => void; theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  const scrolled = useScrolled(24);
  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
      <div className="header-inner">
        <button className="brand" onClick={() => onNavigate('memory')}>
          <span className="monogram"><Flower /></span>
          <span><b>En mémoire de Stéphanie</b><small>Hommage et souvenirs</small></span>
        </button>
        <nav>
          {navLinks.map(([target, label]) => (
            <button key={label} className={view === target ? 'active' : ''} onClick={() => onNavigate(target)}>{label}</button>
          ))}
        </nav>
        <div className="header-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="ghost share" onClick={onShare}><Share2 size={14} /> Partager</button>
          <button className="gold contact-header" onClick={() => onNavigate('contact')}>Contacter la famille <ArrowRight size={14} /></button>
          <button className="menu" onClick={onMenu} aria-label="Ouvrir le menu"><Menu size={20} /></button>
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ onClose, onNavigate }: { onClose: () => void; onNavigate: (target: NavTarget) => void }) {
  const items: [NavTarget, string][] = [['memory', 'Sa vie'], ['programme', 'Parcours'], ['gallery', 'Galerie'], ['prix', 'Le Prix'], ['tributes', 'Hommages'], ['contact', 'Contact famille']];
  return (
    <div className="mobile-menu" role="dialog" aria-modal="true">
      <button className="mobile-close" onClick={onClose} aria-label="Fermer le menu"><X /></button>
      {items.map(([target, label], i) => <button key={label} style={delay(i)} onClick={() => onNavigate(target)}>{label}</button>)}
      <Flower className="mobile-flower" />
    </div>
  );
}

/* ---------- Gallery ---------- */

function PhotoRibbon({ onOpen }: { onOpen: (index: number) => void }) {
  const items = galleryImages.slice(12, 34);
  return (
    <section className="photo-ribbon" aria-label="Ruban de souvenirs">
      <div className="ribbon-track">
        {[...items, ...items].map((src, i) => (
          <button key={`${src}-${i}`} onClick={() => onOpen(galleryImages.indexOf(src))} tabIndex={i < items.length ? 0 : -1} aria-hidden={i >= items.length} aria-label="Agrandir ce souvenir">
            <img src={src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
    </section>
  );
}

function Gallery({ onOpen }: { onOpen: (index: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? galleryImages : galleryImages.slice(0, 12);
  useReveal([expanded]);
  return (
    <section className="gallery layout" id="galerie">
      <div className="section-heading" data-reveal>
        <div><label>Galerie de souvenirs</label><h2>Des moments à garder près du cœur.</h2></div>
        <button className="text-link" onClick={() => setExpanded(value => !value)}>
          {expanded ? 'Afficher moins' : `Voir tous les souvenirs (${galleryImages.length})`} <ArrowRight size={15} className={expanded ? 'rotate-up' : ''} />
        </button>
      </div>
      <div className="gallery-grid">
        {shown.map((src, i) => (
          <button key={src} className={`gallery-item${i % 12 === 0 ? ' featured-image' : i % 12 === 9 ? ' tall-image' : ''}`} data-reveal style={delay(i % 6)} onClick={() => onOpen(i)} aria-label={`Agrandir le souvenir ${i + 1}`}>
            <img src={src} alt={`Souvenir ${i + 1} de Stéphanie`} loading="lazy" />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------- Home sections ---------- */

function MemorialVideos() {
  const videos = [
    { src: '/videos/rassemblement-commemoratif-canada.mp4', title: 'Rassemblement commémoratif au Canada', text: 'Un moment de recueillement et de souvenir organisé au Canada en mémoire de Stéphanie.' },
    { src: '/videos/retour-du-corps-canada.mp4', title: 'Retour du corps depuis le Canada', text: 'Images du retour du corps de Stéphanie depuis le Canada, pour son dernier voyage auprès de sa famille.' },
  ];
  return (
    <section className="video-memories">
      <div className="layout">
        <div className="section-heading" data-reveal><div><label>Souvenirs en vidéo</label><h2>Des vidéos pour se souvenir.</h2></div></div>
        <p className="video-intro" data-reveal>Ces vidéos témoignent des moments de recueillement vécus au Canada et du retour de Stéphanie auprès des siens.</p>
        <div className="video-grid">
          {videos.map((video, i) => (
            <article className="video-card" key={video.src} data-reveal style={delay(i)}>
              <video controls preload="metadata" playsInline><source src={video.src} type="video/mp4" />Votre navigateur ne prend pas en charge la lecture vidéo.</video>
              <div><h3>{video.title}</h3><p>{video.text}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MemorialUpdates({ updates }: { updates: MemorialUpdate[] }) {
  if (!updates.length) return null;
  return (
    <section className="memorial-updates">
      <div className="layout">
        <label data-reveal>Informations de la famille</label>
        <h2 data-reveal>Actualités et prochains rendez-vous.</h2>
        <div className="updates-grid">
          {updates.map((update, i) => (
            <article className="update-card" key={update._id || update.title} data-reveal style={delay(i % 4)}>
              {update.imageUrl && <img src={update.imageUrl} alt="Illustration de l’information familiale" />}
              <div className="update-content">
                <span>{update.date || 'Information familiale'}</span>
                <h3>{update.title}</h3>
                {update.location && <p className="update-location"><MapPin size={14} /> {update.location}</p>}
                <p>{update.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TributePreview({ tributes, onNavigate }: { tributes: Tribute[]; onNavigate: (target: NavTarget) => void }) {
  const [index, setIndex] = useState(0);
  const recent = tributes.slice(0, 8);
  useEffect(() => {
    if (recent.length < 2) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % recent.length), 7000);
    return () => window.clearInterval(timer);
  }, [recent.length]);
  if (!recent.length) return null;
  const tribute = recent[index % recent.length];
  return (
    <section className="tribute-preview">
      <div className="layout" data-reveal>
        <Divider />
        <label>Ils se souviennent</label>
        <blockquote key={tribute._id || index} className="tribute-quote">
          <p>« {tribute.message} »</p>
          <footer><strong>{tribute.name}</strong>{tribute.relation && <span> · {tribute.relation}</span>}</footer>
        </blockquote>
        <div className="tribute-preview-dots">
          {recent.map((t, i) => <button key={t._id || i} className={i === index % recent.length ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`Hommage ${i + 1}`} />)}
        </div>
        <button className="text-link" onClick={() => onNavigate('tributes')}>Lire tous les hommages <ArrowRight size={15} /></button>
      </div>
    </section>
  );
}

function Memory({ onNavigate, onOpen, tributeCount }: { onNavigate: (target: NavTarget) => void; onOpen: (index: number) => void; tributeCount: number }) {
  const pillars = [
    ['Passionnée de sciences', 'Un parcours académique construit autour de la chimie et de l’excellence.'],
    ['Ingénieure diplômée', 'Diplômée de l’École Nationale Supérieure Polytechnique de Douala en 2023.'],
    ['Curieuse et ouverte', 'Une passion pour la lecture, les voyages et la découverte du monde.'],
    ['Une présence précieuse', 'Une femme dont la mémoire reste vivante dans le cœur de ses proches.'],
  ];
  return (
    <main>
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="eyebrow hero-in" style={delay(0)}><Flower />En hommage à Stéphanie</div>
        <HeroSlideshow images={heroPortraits} name={profile.name} />
        <h1 className="hero-in" style={delay(1)}>{profile.name}</h1>
        <p className="dates hero-in" style={delay(2)}>{profile.birth}</p>
        <p className="epitaph hero-in" style={delay(3)}>« Une vie guidée par le savoir, la passion et la générosité. »</p>
        <div className="welcome hero-in" style={delay(4)}>Cet espace est dédié à la mémoire de Stéphanie, à son parcours remarquable et aux souvenirs partagés avec sa famille, ses amis et toutes les personnes qui l’ont aimée.</div>
        <div className="hero-actions hero-in" style={delay(5)}>
          <button className="gold large" onClick={() => onNavigate('programme')}><CalendarDays size={17} /> Découvrir son parcours</button>
          <button className="paper large" onClick={() => onNavigate('tributes')}><MessageCircle size={17} /> Laisser un hommage</button>
        </div>
      </section>

      <section className="stats">
        <div data-reveal style={delay(0)}><strong><CountUp value={1996} from={1950} /></strong><span>Année de naissance</span></div>
        <div data-reveal style={delay(1)}><strong><CountUp value={2023} from={1980} /></strong><span>Diplôme d’ingénieure</span></div>
        <div data-reveal style={delay(2)}><strong><CountUp value={6} /></strong><span>Années d’expériences</span></div>
        <div data-reveal style={delay(3)}><strong><CountUp value={tributeCount} /></strong><span>{tributeCount > 1 ? 'Hommages partagés' : 'Hommage partagé'}</span></div>
      </section>

      <PhotoRibbon onOpen={onOpen} />

      <section className="story layout">
        <div data-reveal>
          <label>Le cœur de son histoire</label>
          <h2>Une femme brillante, passionnée et tournée vers l’avenir.</h2>
          <p>Stéphanie a construit son parcours avec détermination, de ses années au Lycée bilingue de Baleng à sa formation en chimie à l’Université de Dschang, puis à l’École Nationale Supérieure Polytechnique de Douala.</p>
          <p>Ingénieure diplômée en 2023, elle a également enrichi son expérience par plusieurs stages et découvertes professionnelles dans les domaines de l’emploi, de la cosmétique et de la chimie.</p>
          <blockquote>« La connaissance grandit lorsqu’elle est partagée. »</blockquote>
          <button className="text-link" onClick={() => onNavigate('programme')}>Lire son parcours complet <ArrowRight size={15} /></button>
        </div>
        <div className="pillars" data-reveal style={delay(1)}>
          <div className="section-heading"><h3>Ce qui la caractérise</h3><Heart size={18} className="beat" /></div>
          {pillars.map(([title, text], i) => (
            <div className="pillar" key={title} data-reveal style={delay(i + 1)}><span>0{i + 1}</span><div><h4>{title}</h4><p>{text}</p></div></div>
          ))}
        </div>
      </section>

      <StoryPhotos />
      <Gallery onOpen={onOpen} />
    </main>
  );
}

/* ---------- Other pages ---------- */

function Programme() {
  const education = [['2014', 'Lycée bilingue de Baleng', 'Baccalauréat C'], ['2017', 'Université de Dschang', 'Licence en chimie inorganique'], ['2018', 'Université de Dschang', 'Master I en chimie inorganique'], ['2023', 'École Nationale Supérieure Polytechnique de Douala', 'Ingénieure diplômée']];
  const experience = [['Juillet 2016', 'Fond National de l’Emploi', 'Stage'], ['2016', 'Complexe Cosmétique de l’Ouest', 'Visite d’entreprise'], ['2021 – 2022', 'Fermencam', 'Stage'], ['2023 – 2024', 'CMIC de Yassa', 'Stage professionnel']];
  return (
    <main>
      <section className="programme-hero">
        <div className="layout">
          <label className="hero-in" style={delay(0)}>Parcours de Stéphanie</label>
          <h1 className="hero-in" style={delay(1)}>Une histoire<br /><em>de savoir et de passion.</em></h1>
          <p className="hero-in" style={delay(2)}>Retrouvez les étapes académiques et professionnelles qui ont marqué le parcours de {profile.name}.</p>
          <div className="programme-meta hero-in" style={delay(3)}><span><CalendarDays size={17} /><b>{profile.birth}</b></span><span><MapPin size={17} /><b>Douala, Cameroun</b></span></div>
        </div>
      </section>
      <section className="timeline layout">
        <div className="section-heading" data-reveal>
          <div><label>Cursus académique</label><h2>Grandir par l’apprentissage.</h2></div>
          <button className="gold" onClick={() => window.print()}><Download size={14} /> Imprimer le parcours</button>
        </div>
        <div className="timeline-list">
          {education.map(([time, title, text], i) => (
            <div className="timeline-row" key={time + title} data-reveal style={delay(i)}><time>{time}</time><div><h3>{title}</h3><p>{text}</p></div><ChevronRight size={18} /></div>
          ))}
        </div>
      </section>
      <section className="venue">
        <div>
          <label data-reveal>Expérience professionnelle</label>
          <h2 data-reveal>Des expériences au service de la découverte.</h2>
          <p data-reveal>Stéphanie a multiplié les expériences de terrain, développant sa curiosité et sa connaissance du monde professionnel.</p>
          <div className="timeline-list">
            {experience.map(([time, title, text], i) => (
              <div className="timeline-row" key={time + title} data-reveal style={delay(i)}><time>{time}</time><div><h3>{title}</h3><p>{text}</p></div></div>
            ))}
          </div>
        </div>
        <div className="venue-card" data-reveal style={delay(1)}>
          <MapPin size={21} />
          <h3>Langues et centres d’intérêt</h3>
          <p><b>Français :</b> parlé, lu et écrit — excellent<br /><b>Anglais :</b> lu et écrit — moyen</p>
          <p><b>Passionnée de :</b><br />Lecture<br />Voyages</p>
          <button className="text-link" onClick={() => { window.location.href = `mailto:${profile.email}`; }}>Écrire à la famille <ArrowRight size={15} /></button>
        </div>
      </section>
    </main>
  );
}

function Contact({ onNavigate }: { onNavigate: (target: NavTarget) => void }) {
  return (
    <main>
      <section className="page-hero layout contact-hero">
        <label className="hero-in" style={delay(0)}>Contact famille</label>
        <h1 className="hero-in" style={delay(1)}>Rester proches,<br /><em>partager les informations.</em></h1>
        <p className="hero-in" style={delay(2)}>Pour toute question concernant le Prix d’Excellence, les activités commémoratives ou les informations familiales, vous pouvez contacter les proches de Stéphanie.</p>
      </section>
      <section className="contact-grid layout">
        <article className="contact-card" data-reveal style={delay(0)}><Heart size={22} /><h2>Écrire à la famille</h2><p>Pour transmettre un message, une information ou une demande concernant l’hommage.</p><a className="gold" href={`mailto:${profile.email}`}>Envoyer un email <ArrowRight size={15} /></a></article>
        <article className="contact-card" data-reveal style={delay(1)}><MessageCircle size={22} /><h2>Partager un hommage</h2><p>Vous pouvez également publier directement un souvenir sur le mur des hommages.</p><button className="paper" onClick={() => onNavigate('tributes')}>Accéder au mur des hommages <ArrowRight size={15} /></button></article>
        <article className="contact-card" data-reveal style={delay(2)}><label>Coordonnées</label><h3>{profile.name}</h3><p><b>Email :</b><br /><a href={`mailto:${profile.email}`}>{profile.email}</a><br /><br /><b>Téléphone famille :</b><br />À renseigner par la famille</p></article>
      </section>
    </main>
  );
}

/* ---------- App ---------- */

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [view, setView] = useState<View>(() => viewFromPath(window.location.pathname));
  const [menu, setMenu] = useState(false);
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [updates, setUpdates] = useState<MemorialUpdate[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const loadPublicData = useCallback(() => {
    api<Tribute[]>('/api/memorial/tributes').then(rows => { setTributes(rows); setError(''); }).catch(() => setError('Les hommages enregistrés ne sont pas disponibles pour le moment.'));
    api<MemorialUpdate[]>('/api/memorial/updates').then(setUpdates).catch(() => undefined);
  }, []);
  useEffect(() => { loadPublicData(); }, [loadPublicData]);
  useEffect(() => {
    const onPop = () => setView(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    const titles: Record<View, string> = { memory: '', programme: 'Parcours', prix: 'Le Prix', tributes: 'Hommages', contact: 'Contact', family: 'Espace famille' };
    document.title = `${titles[view] ? `${titles[view]} · ` : ''}En mémoire de ${profile.name}`;
  }, [view]);
  useReveal([view, updates.length, tributes.length]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const addTribute = async (tribute: Tribute) => {
    setSaving(true);
    try {
      const saved = await api<Tribute>('/api/memorial/tributes', { method: 'POST', body: tribute });
      setTributes(current => [saved, ...current]);
      setError('');
    } finally { setSaving(false); }
  };

  const go = (next: View) => {
    if (window.location.pathname !== paths[next]) window.history.pushState(null, '', paths[next]);
    setView(next);
  };
  const navigate = (target: NavTarget) => {
    setMenu(false);
    if (target === 'gallery') {
      go('memory');
      window.setTimeout(() => document.getElementById('galerie')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), view === 'memory' ? 0 : 80);
      return;
    }
    go(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: document.title, url }); return; } catch { /* cancelled */ }
    }
    try { await navigator.clipboard.writeText(url); setToast('Lien copié dans le presse-papiers'); } catch { setToast(url); }
  };

  const closeLightbox = useCallback(() => setGalleryIndex(null), []);

  return (
    <>
      <ScrollProgress />
      {view !== 'family' && <Petals />}
      <Header view={view} onNavigate={navigate} onMenu={() => setMenu(true)} onShare={share} theme={theme} onToggleTheme={toggleTheme} />
      {menu && <MobileMenu onClose={() => setMenu(false)} onNavigate={navigate} />}
      <div className="page" key={view}>
        {view === 'memory' && <Memory onNavigate={navigate} onOpen={setGalleryIndex} tributeCount={tributes.length} />}
        {view === 'programme' && <Programme />}
        {view === 'prix' && <Prix email={profile.email} />}
        {view === 'tributes' && <Tributes tributes={tributes} onAdd={addTribute} saving={saving} error={error} onOpenPrize={() => navigate('prix')} />}
        {view === 'contact' && <Contact onNavigate={navigate} />}
        {view === 'family' && <Family onDataChanged={loadPublicData} onLeave={() => navigate('memory')} />}
        {view === 'memory' && (
          <>
            <CandleWall name={profile.name} />
            <TributePreview tributes={tributes} onNavigate={navigate} />
            <MemorialUpdates updates={updates} />
            <MemorialVideos />
          </>
        )}
      </div>
      <footer className="site-footer">
        <div className="footer-flower"><Flower /></div>
        <p className="footer-quote">« Ceux que l’on aime ne meurent jamais tout à fait. »</p>
        <div className="footer-row">
          <span>En mémoire de {profile.name}</span>
          <span>Un hommage préservé avec soin par la famille</span>
          <a className="footer-family" href={paths.family} onClick={event => { event.preventDefault(); navigate('family'); }} aria-label="Accès famille" title="Accès famille"><Lock size={12} /></a>
        </div>
      </footer>
      <BackToTop />
      {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
      <Lightbox images={galleryImages} initialIndex={galleryIndex} onClose={closeLightbox} />
    </>
  );
}
