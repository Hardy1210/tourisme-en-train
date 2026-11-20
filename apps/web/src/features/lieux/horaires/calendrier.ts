/**
 * Quelle règle des horaires s'applique à une date (D108). Fonctions pures : la date du jour arrive en
 * paramètre (`AAAA-MM-JJ`, calculée à Paris par `dateDuJour()`), jamais lue de l'horloge.
 * Réponse à trois valeurs : les vacances scolaires (SH) ne sont pas connues, donc « inconnu ».
 */
import type { DateSansAnnee, ElementJours, Periode, Regle, SelecteurJours } from './analyse';

export type Reponse = 'oui' | 'non' | 'inconnu';
type Jour = { annee: number; mois: number; jour: number; semaine: number; ferie: boolean };

/** Dimanche de Pâques (algorithme de Meeus, calendrier grégorien) : [mois, jour]. */
function paques(annee: number): [number, number] {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  return [mois, ((h + l - 7 * m + 114) % 31) + 1];
}

const FIXES = ['01-01', '05-01', '05-08', '07-14', '08-15', '11-01', '11-11', '12-25'];
/** Lundi de Pâques, Ascension, lundi de Pentecôte : jours après Pâques. */
const MOBILES = [1, 39, 50];

const cle = (mois: number, jour: number) =>
  `${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;

/** Jours fériés de France métropolitaine d'une année, en `MM-JJ`. */
export function joursFeries(annee: number): Set<string> {
  const [mois, jour] = paques(annee);
  const base = Date.UTC(annee, mois - 1, jour);
  const mobiles = MOBILES.map((n) => {
    const d = new Date(base + n * 86_400_000);
    return cle(d.getUTCMonth() + 1, d.getUTCDate());
  });
  return new Set([...FIXES, ...mobiles]);
}

export function lireJour(date: string): Jour {
  const [annee, mois, jour] = date.split('-').map(Number) as [number, number, number];
  return {
    annee,
    mois,
    jour,
    semaine: new Date(Date.UTC(annee, mois - 1, jour)).getUTCDay(),
    ferie: joursFeries(annee).has(cle(mois, jour)),
  };
}

/** Compare deux dates de l'année (et l'année, quand les deux bornes en ont une). */
function dansIntervalle(debut: DateSansAnnee, fin: DateSansAnnee, j: Jour): boolean {
  if (debut.annee !== null && fin.annee !== null) {
    const n = (a: number, m: number, d: number) => a * 10_000 + m * 100 + d;
    const t = n(j.annee, j.mois, j.jour);
    return n(debut.annee, debut.mois, debut.jour) <= t && t <= n(fin.annee, fin.mois, fin.jour);
  }
  const t = j.mois * 100 + j.jour;
  const a = debut.mois * 100 + debut.jour;
  const b = fin.mois * 100 + fin.jour;
  return a <= b ? a <= t && t <= b : t >= a || t <= b; // b < a : l'intervalle passe par le 1er janvier
}

function dansPeriode(p: Periode, j: Jour): boolean {
  if (p.type === 'dates') return dansIntervalle(p.debut, p.fin, j);
  return dansIntervalle(
    { mois: p.debut, jour: 1, annee: null },
    { mois: p.fin, jour: 31, annee: null },
    j,
  );
}

function element(e: ElementJours, j: Jour): Reponse {
  if (e.type === 'feries') return j.ferie ? 'oui' : 'non';
  if (e.type === 'vacances') return 'inconnu';
  const dans =
    e.debut <= e.fin
      ? e.debut <= j.semaine && j.semaine <= e.fin
      : j.semaine >= e.debut || j.semaine <= e.fin;
  return dans ? 'oui' : 'non';
}

function auMoinsUn(elements: ElementJours[], j: Jour): Reponse {
  const reponses = elements.map((e) => element(e, j));
  if (reponses.includes('oui')) return 'oui';
  return reponses.includes('inconnu') ? 'inconnu' : 'non';
}

function jours(s: SelecteurJours, j: Jour): Reponse {
  const a = auMoinsUn(s.union, j);
  const b = s.et ? auMoinsUn(s.et, j) : 'oui';
  if (a === 'non' || b === 'non') return 'non';
  return a === 'oui' && b === 'oui' ? 'oui' : 'inconnu';
}

/** La règle vaut-elle pour ce jour ? Un commentaire seul ne le dit pas. */
export function regleDuJour(r: Regle, j: Jour): Reponse {
  if (r.periodes.length && !r.periodes.some((p) => dansPeriode(p, j))) return 'non';
  if (r.jours) return jours(r.jours, j);
  return r.periodes.length || r.heures ? 'oui' : 'inconnu';
}
