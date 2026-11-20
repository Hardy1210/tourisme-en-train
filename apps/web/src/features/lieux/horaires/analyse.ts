/**
 * Analyse d'un texte `opening_hours` d'OpenStreetMap (D108), limitée aux formes vues dans nos données :
 * saisons (mois, dates, année), jours de la semaine, jours fériés (PH), vacances scolaires (SH), plages
 * d'heures, « off », « 24/7 », commentaires. Toute autre forme → null : le texte d'origine reste affiché.
 */

/** 0 = dimanche … 6 = samedi, comme `Date.getUTCDay()`. */
export type JourSemaine = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DateSansAnnee = { mois: number; jour: number; annee: number | null };

export type Periode =
  | { type: 'mois'; debut: number; fin: number }
  | { type: 'dates'; debut: DateSansAnnee; fin: DateSansAnnee };

export type ElementJours =
  | { type: 'semaine'; debut: JourSemaine; fin: JourSemaine }
  | { type: 'feries' }
  | { type: 'vacances' };

/** `union` : un des éléments suffit ; `et` (« SH Mo-Su ») : il faut en plus un de ceux-là. */
export type SelecteurJours = { union: ElementJours[]; et: ElementJours[] | null };

export type Heures =
  | { type: 'plages'; plages: [string, string][] }
  | { type: 'ferme' }
  | { type: 'ouvert' }
  | { type: 'continu' };

export type Regle = {
  periodes: Periode[];
  jours: SelecteurJours | null;
  heures: Heures | null;
  note: string | null;
};

/** `ordreSur` faux : la règle du jour n'est pas sûre (règle ajoutée par « , » ou de secours « || »). */
export type HorairesAnalyses = { regles: Regle[]; ordreSur: boolean };

export const MOIS_OSM = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
export const JOURS_OSM = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const M = `(${MOIS_OSM.join('|')})`;
const J = `(${JOURS_OSM.join('|')})`;
const JOUR_DU_MOIS = String.raw`(\d{1,2})(?!\d|:\d)`;
const DATE = new RegExp(
  String.raw`^(?:(\d{4}) )?${M} ${JOUR_DU_MOIS}(?:\s*-\s*(?:(?:(\d{4}) )?${M} )?${JOUR_DU_MOIS})?`,
);
const MOIS = new RegExp(String.raw`^${M}(?:-${M})?(?![\w\[])`);
const ELEMENT_JOURS = new RegExp(String.raw`^(?:(PH|SH)|${J}(?:-${J})?)(?![\w\[])`);
const HEURE = String.raw`(?:\d{1,2}:\d\d|sunrise|sunset|dawn|dusk)`;
const PLAGE = new RegExp(String.raw`^(${HEURE})\s*-\s*(${HEURE})`);
/** Une virgule après une heure, suivie d'un sélecteur ou d'un commentaire, ouvre une règle ajoutée. */
const REGLE_AJOUTEE = new RegExp(
  String.raw`(?<=\d\d:\d\d|sunrise|sunset|dawn|dusk)\s*,\s*(?=[A-Z"])`,
);

const moisDe = (nom: string) => MOIS_OSM.indexOf(nom) + 1;
const jourDe = (nom: string) => JOURS_OSM.indexOf(nom) as JourSemaine;

/** Lit une liste d'éléments séparés par des virgules ; avance le curseur. */
function lireListe<T>(texte: string, lire: (t: string) => [T, number] | null): [T[], string] {
  const elements: T[] = [];
  let reste = texte;
  for (;;) {
    const lu = lire(reste);
    if (!lu) break;
    elements.push(lu[0]);
    reste = reste.slice(lu[1]);
    const virgule = /^\s*,\s*/.exec(reste);
    if (!virgule || !lire(reste.slice(virgule[0].length))) break;
    reste = reste.slice(virgule[0].length);
  }
  return [elements, reste];
}

function lirePeriode(texte: string): [Periode, number] | null {
  const d = DATE.exec(texte);
  if (d) {
    const debut = { annee: d[1] ? Number(d[1]) : null, mois: moisDe(d[2]!), jour: Number(d[3]) };
    const fin = d[5]
      ? { annee: d[4] ? Number(d[4]) : null, mois: moisDe(d[5]), jour: Number(d[6]) }
      : { ...debut, jour: d[6] ? Number(d[6]) : debut.jour };
    return [{ type: 'dates', debut, fin }, d[0].length];
  }
  const m = MOIS.exec(texte);
  if (!m) return null;
  return [{ type: 'mois', debut: moisDe(m[1]!), fin: moisDe(m[2] ?? m[1]!) }, m[0].length];
}

function lireElementJours(texte: string): [ElementJours, number] | null {
  const e = ELEMENT_JOURS.exec(texte);
  if (!e) return null;
  if (e[1]) return [{ type: e[1] === 'PH' ? 'feries' : 'vacances' }, e[0].length];
  const debut = jourDe(e[2]!);
  return [{ type: 'semaine', debut, fin: e[3] ? jourDe(e[3]) : debut }, e[0].length];
}

function lirePlage(texte: string): [[string, string], number] | null {
  const p = PLAGE.exec(texte);
  return p ? [[p[1]!, p[2]!], p[0].length] : null;
}

function lireHeures(texte: string): [Heures | null, string] {
  const mot = /^(24\/7|off|closed|open)(?![\w/])/.exec(texte);
  if (mot) {
    const type = mot[1] === '24/7' ? 'continu' : mot[1] === 'open' ? 'ouvert' : 'ferme';
    return [{ type }, texte.slice(mot[0].length)];
  }
  const [plages, reste] = lireListe(texte, lirePlage);
  return [plages.length ? { type: 'plages', plages } : null, reste];
}

/** Une règle complète, ou null si une partie n'est pas comprise. */
export function analyserRegle(texte: string): Regle | null {
  let reste = texte.trim();
  const avancer = (r: string) => (reste = r.replace(/^\s*:?\s*/, ''));

  const [periodes, apresPeriodes] = lireListe(reste, lirePeriode);
  avancer(apresPeriodes);
  const [union, apresJours] = lireListe(reste, lireElementJours);
  avancer(apresJours);
  let et: ElementJours[] | null = null;
  if (union.length && union.every((e) => e.type !== 'semaine')) {
    const [suite, apresSuite] = lireListe(reste, lireElementJours);
    if (suite.length) {
      et = suite;
      avancer(apresSuite);
    }
  }
  const [heures, apresHeures] = lireHeures(reste);
  avancer(apresHeures);
  const commentaire = /^"([^"]*)"/.exec(reste);
  if (commentaire) avancer(reste.slice(commentaire[0].length));

  if (reste !== '') return null;
  const note = commentaire?.[1]?.trim() || null;
  if (!periodes.length && !union.length && !heures && !note) return null;
  return { periodes, jours: union.length ? { union, et } : null, heures, note };
}

export function analyserHoraires(texte: string): HorairesAnalyses | null {
  const secours = texte.includes('||');
  let ajoutee = false;
  const regles: Regle[] = [];
  for (const partie of texte.split(/;|\|\|/)) {
    const morceaux = partie.split(REGLE_AJOUTEE);
    if (morceaux.length > 1) ajoutee = true;
    for (const morceau of morceaux) {
      if (morceau.trim() === '') continue;
      const regle = analyserRegle(morceau);
      if (!regle) return null;
      regles.push(regle);
    }
  }
  return regles.length ? { regles, ordreSur: !secours && !ajoutee } : null;
}
