/**
 * Horaires d'ouverture lisibles (D108) : le texte `opening_hours` devient des lignes françaises,
 * « quand » (dates, jours) et heures, et la ligne qui s'applique aujourd'hui est marquée quand on en est sûr.
 * Texte non compris → null : l'écran affiche alors le texte d'origine.
 */
import {
  analyserHoraires,
  type DateSansAnnee,
  type ElementJours,
  type Heures,
  type Periode,
  type Regle,
} from './analyse';
import { lireJour, regleDuJour } from './calendrier';

export type LigneHoraires = { quand: string | null; heures: string[]; aujourdhui: boolean };

const MOIS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];
const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const SOLEIL: Record<string, string> = {
  sunrise: 'lever du soleil',
  sunset: 'coucher du soleil',
  dawn: 'aube',
  dusk: 'crépuscule',
};
const TIRET = ' – ';

const nomMois = (mois: number) => MOIS[mois - 1] ?? '';
const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

function date(d: DateSansAnnee, avecMois = true): string {
  const jour = d.jour === 1 ? '1er' : String(d.jour);
  return [jour, avecMois && nomMois(d.mois), d.annee].filter(Boolean).join(' ');
}

function periode(p: Periode): string {
  if (p.type === 'mois')
    return p.debut === p.fin ? nomMois(p.debut) : nomMois(p.debut) + TIRET + nomMois(p.fin);
  const { debut, fin } = p;
  if (debut.mois === fin.mois && debut.jour === fin.jour && debut.annee === fin.annee)
    return date(debut);
  const memeMois = debut.mois === fin.mois && debut.annee === fin.annee && debut.jour < fin.jour;
  return date(debut, !memeMois) + TIRET + date(fin);
}

function elementJours(e: ElementJours): string {
  if (e.type === 'feries') return 'jours fériés';
  if (e.type === 'vacances') return 'vacances scolaires';
  if (e.debut === e.fin) return JOURS[e.debut] ?? '';
  // Lundi → dimanche (ou toute plage de 7 jours) : toute la semaine.
  if ((e.fin - e.debut + 7) % 7 === 6) return 'tous les jours';
  return (JOURS[e.debut] ?? '') + TIRET + (JOURS[e.fin] ?? '');
}

/** « lun. – ven., sam. » ; toute la semaine et les fériés : « tous les jours et jours fériés ». */
function listeJours(elements: ElementJours[]): string {
  const textes = elements.map(elementJours);
  if (textes.includes('tous les jours') && textes.includes('jours fériés')) {
    const autres = textes.filter((t) => t !== 'tous les jours' && t !== 'jours fériés');
    return ['tous les jours et jours fériés', ...autres].join(', ');
  }
  return textes.join(', ');
}

function quand(r: Regle): string | null {
  const morceaux: string[] = [];
  if (r.periodes.length) morceaux.push(r.periodes.map(periode).join(', '));
  if (r.jours) {
    const union = listeJours(r.jours.union);
    const et = r.jours.et && listeJours(r.jours.et);
    morceaux.push(et && et !== 'tous les jours' ? `${union} (${et})` : union);
  }
  if (morceaux.length) return majuscule(morceaux.join(' · '));
  const sansJour = r.heures?.type === 'plages' || r.heures?.type === 'continu';
  return sansJour ? 'Tous les jours' : null;
}

function heure(h: string): string {
  if (SOLEIL[h]) return SOLEIL[h];
  const [hh, mm] = h.split(':');
  return mm === '00' ? `${Number(hh)} h` : `${Number(hh)} h ${mm}`;
}

function heures(h: Heures | null, note: string | null): string[] {
  const lignes: string[] = [];
  if (h?.type === 'ferme') lignes.push('Fermé');
  if (h?.type === 'continu') lignes.push('24 h/24');
  if (h?.type === 'plages') {
    for (const [debut, fin] of h.plages) {
      lignes.push(
        debut === '00:00' && fin === '24:00' ? '24 h/24' : heure(debut) + TIRET + heure(fin),
      );
    }
  }
  if (note) lignes.push(note);
  else if (!h || h.type === 'ouvert') lignes.push('Ouvert');
  return lignes;
}

export function lireHoraires(texte: string, dateDuJour: string): LigneHoraires[] | null {
  const analyse = analyserHoraires(texte);
  if (!analyse) return null;
  const jour = lireJour(dateDuJour);
  // La règle écrite en dernier l'emporte : on la cherche depuis la fin ; un « inconnu » avant elle arrête tout.
  let duJour = -1;
  if (analyse.ordreSur) {
    for (let i = analyse.regles.length - 1; i >= 0; i--) {
      const reponse = regleDuJour(analyse.regles[i]!, jour);
      if (reponse === 'non') continue;
      if (reponse === 'oui') duJour = i;
      break;
    }
  }
  return analyse.regles.map((r, i) => ({
    quand: quand(r),
    heures: heures(r.heures, r.note),
    aujourdhui: i === duJour,
  }));
}

/** « ven. 20 nov. », « ven. 1er janv. » ; la date arrive en paramètre (`AAAA-MM-JJ`). */
function jourEnClair(dateDuJour: string): string {
  const { mois, jour, semaine } = lireJour(dateDuJour);
  return `${JOURS[semaine] ?? ''} ${date({ annee: null, mois, jour })}`;
}

/**
 * Résumé en haut du bloc : « Aujourd’hui, ven. 20 nov. » et les plages de la règle du jour, une par ligne.
 * Null sans ligne du jour sûre : on n'affiche rien plutôt qu'un jour faux.
 */
export function resumeDuJour(
  lignes: LigneHoraires[],
  dateDuJour: string,
): { jour: string; heures: string[] } | null {
  const ligne = lignes.find((l) => l.aujourdhui);
  if (!ligne) return null;
  return { jour: `Aujourd’hui, ${jourEnClair(dateDuJour)}`, heures: ligne.heures };
}
