// Mise en forme des destinations : calculs purs, sans lecture de l'horloge.
import type { Destination } from './schemas';

/** « 22 min », « 1 h », « 1 h 34 ». */
export function formaterDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const reste = minutes % 60;
  return `${Math.floor(minutes / 60)} h${reste === 0 ? '' : ` ${String(reste).padStart(2, '0')}`}`;
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
