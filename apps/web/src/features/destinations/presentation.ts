// Mise en forme des destinations : calculs purs, sans lecture de l'horloge.
import { trainParti } from '@/lib/dates/heures';
import type { Destination } from './schemas';

/** « 22 min », « 1 h », « 1 h 34 ». */
export function formaterDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const reste = minutes % 60;
  return `${Math.floor(minutes / 60)} h${reste === 0 ? '' : ` ${String(reste).padStart(2, '0')}`}`;
}

/** Le train annoncé est parti et la réponse suivante n'est pas encore là. */
export type DestinationAffichee = Destination & { prochainPerime?: boolean };

/**
 * Un train déjà parti n'est jamais affiché, quel que soit l'âge de la réponse (cache, D068). Sans lui,
 * la carte ne doit pas annoncer « Plus de train » : le suivant existe peut-être.
 */
export function sansTrainsPartis(
  destinations: readonly Destination[],
  dateService: string,
  maintenant: { dateDuJour: string; heureActuelleS: number },
): DestinationAffichee[] {
  return destinations.map((d) =>
    d.prochainDepart !== null && trainParti(d.prochainDepart.s, dateService, maintenant)
      ? { ...d, prochainDepart: null, prochaineArrivee: null, prochainPerime: true }
      : d,
  );
}

/**
 * Lieux à voir à pied depuis la gare, dans les catégories choisies : l'API ne renvoie que celles-là
 * (bulle de la carte, mini-fiche). Avec un filtre, un lieu peut compter dans deux catégories (D060).
 */
export function totalLieux(lieuxParCategorie: Destination['lieuxParCategorie']): number {
  return Object.values(lieuxParCategorie).reduce((somme, n) => somme + (n ?? 0), 0);
}

/** « 1 lieu », « 12 lieux ». */
export function formaterNombreLieux(nombre: number): string {
  return `${nombre} ${nombre > 1 ? 'lieux' : 'lieu'}`;
}

/** Couleur de la tranche de temps ; classes entières pour que Tailwind les trouve. */
const COULEURS = ['bg-map-time-1', 'bg-map-time-2', 'bg-map-time-3', 'bg-map-time-4'] as const;

/** Rang de la tranche dans les bornes ; au-delà de la dernière, la dernière couleur. */
function rangTranche(tranche: string, bornes: readonly number[]): number {
  const index = bornes.findIndex((borne) => tranche === `<=${borne}`);
  return index === -1 ? COULEURS.length - 1 : index;
}

export function couleurTranche(tranche: string, bornes: readonly number[]): string {
  return COULEURS[rangTranche(tranche, bornes)] ?? 'bg-map-time-4';
}

/** Icône de train inversée (D118) : contour et train dans la couleur de la tranche, sur fond blanc. */
const TRAITS = [
  'border-map-time-1 text-map-time-1',
  'border-map-time-2 text-map-time-2',
  'border-map-time-3 text-map-time-3',
  'border-map-time-4 text-map-time-4',
] as const;

export function traitTranche(tranche: string, bornes: readonly number[]): string {
  return TRAITS[rangTranche(tranche, bornes)] ?? 'border-map-time-4 text-map-time-4';
}

/**
 * Billet de « Votre gare » : le train direct qui part le plus tôt parmi les destinations, et celle vers
 * laquelle il va (« 10:12 », « Beaune »). On connaît la destination, pas le terminus : « Vers », jamais
 * « Direction » (Hardy, 26/11).
 */
export function prochainTrainDirect(
  destinations: readonly Destination[],
): { heure: string; vers: string } | null {
  let meilleur: Destination | null = null;
  for (const d of destinations) {
    if (d.prochainDepart === null) continue;
    if (meilleur?.prochainDepart == null || d.prochainDepart.s < meilleur.prochainDepart.s) {
      meilleur = d;
    }
  }
  return meilleur?.prochainDepart
    ? { heure: meilleur.prochainDepart.texte, vers: meilleur.titre }
    : null;
}

/** Toujours une estimation (règle 7) : « ≈ 12 € », « ≈ 12 à 18 € ». */
export function formaterPrix(prix: { min: number; max: number }): string {
  return prix.min === prix.max ? `≈ ${prix.min} €` : `≈ ${prix.min} à ${prix.max} €`;
}

/** Le prix n'est jamais présenté comme réel (CLAUDE.md § 2, règle 7). */
export const MENTION_ESTIMATION = 'estimation';

/** « 3,2 » : la virgule française, un chiffre après. */
export const formaterKg = (kg: number): string => kg.toFixed(1).replace('.', ',');

/** Prochaine durée à proposer quand rien ne correspond ; null si c'est déjà la plus grande. */
export function dureeElargie(actuelle: number, options: readonly number[]): number | null {
  return [...options].sort((a, b) => a - b).find((option) => option > actuelle) ?? null;
}

/**
 * Les destinations montrées après `pages` toucher(s) de « Voir plus », et combien il en reste (D122) :
 * les `pages × parPage` premières, dans l'ordre reçu. Toute la liste d'un coup (≈ 100 cartes) figeait la
 * feuille d'Explorer au début de chaque mouvement, et faisait planter Safari sur l'iPhone.
 */
export function destinationsMontrees<T>(
  destinations: readonly T[],
  pages: number,
  parPage: number,
): { montrees: readonly T[]; reste: number } {
  const montrees = destinations.slice(0, pages * parPage);
  return { montrees, reste: destinations.length - montrees.length };
}
