/* Content from the family's faire-part and biography. */

export const deathNotice = {
  date: '13 octobre 2026',
  place: 'au Canada',
  text: 'Ont la profonde douleur de vous faire part du décès de leur belle petite-fille, belle-fille, femme, enfant, sœur et nièce, survenu le 13 octobre 2026 au Canada, des suites d’une courte maladie.',
};

export const announcingFamilies = [
  'La grande famille SATOUKAM à Babouantou',
  'La grande famille MIAFEU NGUEMAKO à Babouantou',
  'La grande famille PIKO à Babouantou',
  'La grande famille NGOUNOU à Penja',
  'La famille NEGUEM SOUP Ghislain à Douala',
  'La famille NGOUNOU TIENTCHEU Rostant au Canada',
  'La grande famille TCHONANG Isaac à Bafoussam',
  'La grande famille NJILO Emmanuel à Douala',
  'La grande famille KOUANHOU Emmanuel à Bafoussam',
  'Mme KUITCHOUA née NANA NJILO Aurience',
  'La famille KOM Donald',
  'La famille NGUEMENI Herbert',
  'Dr NANTCHOUANG Pedol Franck',
  'Mlle NJILO Darnelle',
];

export type ScheduleItem = { time: string; label: string };
export type FuneralEvent = {
  id: string;
  date: string;          // YYYY-MM-DD (local date of the event)
  start?: string;        // HH:MM local time, when known
  dayLabel: string;
  stage: string;
  title: string;
  place: string;
  mapQuery?: string;
  details?: string;
  schedule?: ScheduleItem[];
};

export const funeralProgramme: FuneralEvent[] = [
  { id: 'veillee-canada', date: '2026-11-07', dayLabel: 'Samedi 7 novembre 2026', stage: 'Au Canada', title: 'Veillée', place: 'Salaberry-de-Valleyfield, Canada', mapQuery: 'Salaberry-de-Valleyfield, Québec, Canada' },
  { id: 'rapatriement', date: '2026-11-09', dayLabel: 'Lundi 9 novembre 2026', stage: 'Le retour', title: 'Rapatriement de la dépouille', place: 'Du Canada vers l’aéroport international de Douala', mapQuery: 'Aéroport international de Douala' },
  { id: 'reception', date: '2026-11-11', dayLabel: 'Mercredi 11 novembre 2026', stage: 'Le retour', title: 'Réception et départ pour Bafoussam', place: 'Morgue de l’Hôpital Régional de Bafoussam', mapQuery: 'Hôpital Régional de Bafoussam' },
  {
    id: 'levee-de-corps', date: '2026-12-04', start: '14:00', dayLabel: 'Vendredi 4 décembre 2026', stage: 'Bafoussam', title: 'Levée de corps et veillée',
    place: 'Hôpital Régional de Bafoussam, puis 3e rue Tougang-Ville', mapQuery: 'Hôpital Régional de Bafoussam',
    schedule: [
      { time: '14h00', label: 'Levée de corps à l’Hôpital Régional de Bafoussam' },
      { time: 'Soirée', label: 'Veillée à la 3e rue Tougang-Ville, jusqu’à l’aube' },
    ],
  },
  {
    id: 'inhumation', date: '2026-12-05', start: '06:00', dayLabel: 'Samedi 5 décembre 2026', stage: 'Babouantou', title: 'Obsèques et inhumation',
    place: 'Bafang — Babouantou, quartier Bandoula', mapQuery: 'Babouantou, Bafang, Cameroun',
    schedule: [
      { time: '6h00', label: 'Départ de la dépouille de Bafoussam pour Bafang (Babouantou, quartier Bandoula)' },
      { time: '8h00', label: 'Arrivée et installation des convives' },
      { time: '10h00', label: 'Début des offices religieux' },
      { time: '10h30', label: 'Témoignages' },
      { time: '11h30', label: 'Inhumation' },
      { time: '12h00', label: 'Collation' },
    ],
  },
];

/** Event timestamp (local time of the visitor; good enough for day-level status). */
export const eventTime = (event: FuneralEvent) => new Date(`${event.date}T${event.start || '00:00'}:00`);
export const eventEnd = (event: FuneralEvent) => new Date(`${event.date}T23:59:59`);
export const nextFuneralEvent = (now = new Date()) => funeralProgramme.find(event => eventEnd(event) >= now) || null;

/** Downloadable calendar entry (.ics) for one event. */
export function calendarFile(event: FuneralEvent) {
  const day = event.date.replace(/-/g, '');
  const timing = event.start
    ? [`DTSTART:${day}T${event.start.replace(':', '')}00`, 'DURATION:PT6H']
    : [`DTSTART;VALUE=DATE:${day}`, 'DURATION:P1D'];
  const description = [event.place, ...(event.schedule || []).map(item => `${item.time} : ${item.label}`)].join('\\n');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Memorial Stephanie//FR', 'BEGIN:VEVENT',
    `UID:${event.id}@memorial-stephanie`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, ...timing,
    `SUMMARY:${event.title} — KOUANHOU Stéphanie Donald`,
    `LOCATION:${event.place.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${description.replace(/,/g, '\\,')}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
export const mapLink = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
