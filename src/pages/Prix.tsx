import { CSSProperties, useCallback, useEffect, useState } from 'react';
import { Award, BookOpen, CalendarCheck, Crown, Download, FileText, GraduationCap, HandHeart, Medal, ScrollText, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react';
import { api, Laureate } from '../api';
import { PrizeEmblem } from '../components/PrizeEmblem';
import { Lightbox } from '../components/Lightbox';
import { Divider, Flower } from '../components/Flower';
import { useReveal } from '../hooks';

const PDF = '/documents/prix-excellence-leadership-kouanhou-stephanie.pdf';
const pages = Array.from({ length: 8 }, (_, i) => `/documents/prix/page-${i + 1}.jpg`);
const documents = [
  { title: 'Décision portant création du Prix', ref: 'N° 002/010/LBB', date: '22 octobre 2026', first: 0, count: 3, icon: ScrollText },
  { title: 'Procès-verbal de la réunion de concertation', ref: 'Lycée & Comité initiateur', date: '21 octobre 2026', first: 3, count: 3, icon: Users },
  { title: 'Message d’hommage et de condoléances', ref: 'Lycée Bilingue de Baleng', date: '22 octobre 2026', first: 6, count: 1, icon: HandHeart },
  { title: 'Communiqué d’information', ref: 'Lycée & Comité d’organisation', date: '22 octobre 2026', first: 7, count: 1, icon: FileText },
];
const pageCaption = (index: number) => {
  const doc = documents.find(d => index >= d.first && index < d.first + d.count)!;
  return `${doc.title} — page ${index - doc.first + 1}/${doc.count}`;
};
const delay = (i: number) => ({ '--d': i } as CSSProperties);

export function Prix({ email }: { email: string }) {
  const [laureates, setLaureates] = useState<Laureate[]>([]);
  const [viewer, setViewer] = useState<number | null>(null);
  const closeViewer = useCallback(() => setViewer(null), []);
  useEffect(() => { api<Laureate[]>('/api/memorial/laureates').then(setLaureates).catch(() => undefined); }, []);
  useReveal([laureates.length]);

  const supportMail = `mailto:${email}?subject=${encodeURIComponent('Soutien au Prix d’Excellence et de Leadership Kouanhou Stéphanie Donald')}`;

  return (
    <main className="prix-page">
      {/* Hero */}
      <section className="prix-hero">
        <div className="prix-hero-inner">
          <div>
            <label className="hero-in" style={delay(0)}>Lycée Bilingue de Baleng · Institué le 22 octobre 2026</label>
            <h1 className="hero-in" style={delay(1)}>Prix d’Excellence<br />et de Leadership<em>Kouanhou Stéphanie Donald</em></h1>
            <p className="hero-in" style={delay(2)}>Créé au sein du Lycée où elle a étudié, ce prix récompense chaque année les élèves du Second Cycle qui allient réussite académique de premier ordre et sens du service collectif — à son image.</p>
            <div className="hero-actions hero-in" style={delay(3)}>
              <a className="gold large" href={PDF} download="Prix-Excellence-Leadership-Kouanhou-Stephanie-Donald.pdf"><Download size={17} /> Documents officiels (PDF)</a>
              <a className="paper large" href="#soutenir"><HandHeart size={17} /> Soutenir le Prix</a>
            </div>
          </div>
          <div className="prix-hero-emblem hero-in" style={delay(2)}>
            <PrizeEmblem />
            <span className="prix-sparkle s1"><Sparkles size={18} /></span>
            <span className="prix-sparkle s2"><Sparkles size={14} /></span>
            <span className="prix-sparkle s3"><Sparkles size={12} /></span>
          </div>
        </div>
      </section>

      {/* Quote from the school */}
      <section className="prix-quote layout" data-reveal>
        <Divider />
        <blockquote>
          « Feue Kouanhou Stéphanie Donald fut, dans nos murs, l’incarnation de la jeunesse travailleuse, disciplinée et ambitieuse. »
          <footer>Lycée Bilingue de Baleng — Message d’hommage et de condoléances</footer>
        </blockquote>
      </section>

      {/* Why */}
      <section className="prix-why layout">
        <div data-reveal>
          <label>Pourquoi ce prix</label>
          <h2>Transmettre ce qu’elle incarnait.</h2>
          <p>En perpétuant sa mémoire à travers ce prix, le Lycée Bilingue de Baleng entend honorer une ancienne élève d’exception et transmettre aux générations présentes les valeurs qui furent les siennes.</p>
          <div className="prix-values">
            {['L’effort', 'La discipline', 'Le leadership responsable'].map((value, i) => <span key={value} style={delay(i)}><Flower />{value}</span>)}
          </div>
        </div>
        <div className="prix-facts">
          {[
            [GraduationCap, 'Promotion 2014', 'Ancienne élève du Lycée Bilingue de Baleng.'],
            [Crown, 'Chef de classe et première de sa classe', 'Elle a marqué sa promotion par son exemplarité, sa rigueur et son sens du service.'],
            [Medal, 'Ingénieure en Génie des Procédés', 'Diplômée de l’École Nationale Supérieure Polytechnique de Douala.'],
          ].map(([Icon, title, text], i) => {
            const I = Icon as typeof Award;
            return <div className="prix-fact" key={title as string} data-reveal style={delay(i)}><span><I size={20} /></span><div><h3>{title as string}</h3><p>{text as string}</p></div></div>;
          })}
        </div>
      </section>

      {/* Eligibility */}
      <section className="prix-criteria">
        <div className="layout">
          <div className="section-heading" data-reveal>
            <div><label>Critères d’éligibilité</label><h2>Qui peut recevoir le Prix ?</h2></div>
          </div>
          <p className="prix-lead" data-reveal>Les élèves régulièrement inscrits au <b>Second Cycle</b> — séries francophones de la <b>2nde à la Terminale</b>, séries anglophones de <b>Form 5 à Upper Sixth</b> — sans distinction de sexe, remplissant <b>cumulativement</b> les trois conditions suivantes :</p>
          <div className="criteria-grid">
            {[
              [Trophy, 'Première de sa classe', 'Être classé(e) 1er / 1ère de sa classe : meilleure moyenne générale de l’année scolaire.'],
              [Crown, 'Chef de classe', 'Occuper officiellement la fonction de Chef de Classe / Class Prefect durant la même année scolaire.'],
              [ShieldCheck, 'Conduite irréprochable', 'Aucune sanction disciplinaire au cours de l’année.'],
            ].map(([Icon, title, text], i) => {
              const I = Icon as typeof Award;
              return <article className="criteria-card" key={title as string} data-reveal style={delay(i)}><span className="criteria-number">0{i + 1}</span><I size={26} /><h3>{title as string}</h3><p>{text as string}</p></article>;
            })}
          </div>
          <p className="prix-note" data-reveal>Si plusieurs élèves remplissent ces conditions, le prix est attribué à celui ou celle ayant obtenu la moyenne générale annuelle la plus élevée ; les autres bénéficient de lots secondaires.</p>
        </div>
      </section>

      {/* Reward */}
      <section className="prix-reward layout">
        <div className="section-heading" data-reveal><div><label>La récompense</label><h2>Ce que comprend le Prix.</h2></div></div>
        <div className="reward-grid">
          {[
            [ScrollText, 'Diplôme d’Excellence & de Leadership', 'Co-signé par le Proviseur et le Président du comité.'],
            [BookOpen, 'Bourse d’études', 'Une gratification financière pour l’année académique suivante.'],
            [Trophy, 'Trophée', 'Une distinction d’honneur remise au lauréat ou à la lauréate.'],
          ].map(([Icon, title, text], i) => {
            const I = Icon as typeof Award;
            return <article className="reward-card" key={title as string} data-reveal style={delay(i)}><div className="reward-icon"><I size={28} /></div><h3>{title as string}</h3><p>{text as string}</p></article>;
          })}
        </div>
        <article className="inspiration-card" data-reveal>
          <Sparkles size={26} />
          <div>
            <label>Mention spéciale</label>
            <h3>« Inspiration Kouanhou »</h3>
            <p>Une mention particulière qui peut être décernée à une élève s’illustrant par son parcours, sans condition de rang. Le comité peut également décerner des mentions spéciales à des élèves ayant fait preuve d’un leadership remarquable dans d’autres fonctions : délégués, responsables d’association, de coopérative ou de club.</p>
          </div>
        </article>
      </section>

      {/* Selection process */}
      <section className="prix-process">
        <div className="layout">
          <div className="section-heading" data-reveal><div><label>Désignation du lauréat</label><h2>De la salle de classe à la cérémonie.</h2></div></div>
          <ol className="process-steps">
            {[
              ['Fin du 3e trimestre', 'La Direction du Lycée dresse la liste des élèves remplissant la double condition.'],
              ['Conseil de classe', 'Le procès-verbal confirmant la meilleure moyenne générale annuelle est transmis au comité.'],
              ['Préparation', 'Le comité met les dotations à disposition au moins une semaine avant la cérémonie.'],
              ['Remise du Prix', 'Lors de la cérémonie annuelle de l’excellence scolaire du Lycée Bilingue de Baleng, à laquelle le comité est associé.'],
            ].map(([title, text], i) => (
              <li key={title} data-reveal style={delay(i)}><span>{i + 1}</span><h3>{title}</h3><p>{text}</p></li>
            ))}
          </ol>
        </div>
      </section>

      {/* Laureates */}
      <section className="prix-laureates layout">
        <div className="section-heading" data-reveal><div><label>Palmarès</label><h2>Les lauréats.</h2></div><Award size={22} /></div>
        {laureates.length === 0 ? (
          <div className="laureate-empty" data-reveal>
            <PrizeEmblem size="small" />
            <p>Les lauréats seront présentés ici après chaque cérémonie annuelle de l’excellence scolaire.</p>
          </div>
        ) : (
          <div className="laureate-grid">
            {laureates.map((laureate, i) => (
              <article className="laureate-card" key={laureate._id || laureate.name} data-reveal style={delay(i % 3)}>
                {laureate.imageUrl ? <img src={laureate.imageUrl} alt={laureate.name} /> : <div className="laureate-initials">{laureate.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('')}</div>}
                <span className="laureate-year">{laureate.year}</span>
                <h3>{laureate.name}</h3>
                <p className="laureate-distinction">{laureate.distinction || 'Lauréat·e du Prix'}</p>
                {laureate.className && <p className="laureate-class">{laureate.className}</p>}
                {laureate.note && <p className="laureate-note">{laureate.note}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Support */}
      <section className="prix-support" id="soutenir">
        <div className="layout prix-support-inner" data-reveal>
          <HandHeart size={34} />
          <div>
            <label>Soutenir le Prix</label>
            <h2>Un prix porté par tous ceux qui l’aimaient.</h2>
            <p>Le Prix est financé par un fonds participatif alimenté par des donateurs, sympathisants et volontaires de bonne volonté, ainsi que par des soutiens du monde académique et professionnel. Le Comité d’organisation en assure la collecte et la gestion, sur un compte dédié distinct des fonds de l’établissement.</p>
            <p className="prix-support-note">Les modalités de contribution seront précisées par le Comité. En attendant, vous pouvez manifester votre engagement auprès du Comité d’organisation.</p>
            <a className="gold large" href={supportMail}><HandHeart size={17} /> Manifester mon soutien</a>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="prix-documents layout">
        <div className="section-heading" data-reveal>
          <div><label>Documents officiels</label><h2>Les textes fondateurs.</h2></div>
          <a className="text-link" href={PDF} download="Prix-Excellence-Leadership-Kouanhou-Stephanie-Donald.pdf"><Download size={15} /> Télécharger le dossier complet</a>
        </div>
        <div className="document-grid">
          {documents.map((doc, i) => {
            const Icon = doc.icon;
            return (
              <button className="document-card" key={doc.title} data-reveal style={delay(i)} onClick={() => setViewer(doc.first)}>
                <div className="document-thumb"><img src={pages[doc.first]} alt="" loading="lazy" /><span>{doc.count} page{doc.count > 1 ? 's' : ''}</span></div>
                <div className="document-info"><Icon size={18} /><h3>{doc.title}</h3><p>{doc.ref}</p><small><CalendarCheck size={13} /> {doc.date}</small></div>
              </button>
            );
          })}
        </div>
        <div className="prix-signatories" data-reveal>
          <div><span>Le Proviseur du Lycée Bilingue de Baleng</span><strong>M. Heuyam Claude</strong></div>
          <Flower />
          <div><span>Le Président du Comité d’organisation</span><strong>Nzapa Arnaule</strong></div>
        </div>
      </section>

      <Lightbox images={pages} initialIndex={viewer} onClose={closeViewer} label="Documents officiels du Prix" caption={pageCaption} variant="document" />
    </main>
  );
}
