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

export function couleurTranche(tranche: string, bornes: readonly number[]): string {
  const index = bornes.findIndex((borne) => tranche === `<=${borne}`);
  return COULEURS[index === -1 ? COULEURS.length - 1 : index] ?? 'bg-map-time-4';
}

/** Le train direct qui part le plus tôt parmi les destinations : « 10:12 → Beaune ». */
export function prochainTrainDirect(destinations: readonly Destination[]): string | null {
  let meilleur: Destination | null = null;
  for (const d of destinations) {
    if (d.prochainDepart === null) continue;
    if (meilleur?.prochainDepart == null || d.prochainDepart.s < meilleur.prochainDepart.s) {
      meilleur = d;
    }
  }
  return meilleur?.prochainDepart ? `${meilleur.prochainDepart.texte} → ${meilleur.titre}` : null;
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
