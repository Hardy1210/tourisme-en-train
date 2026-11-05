import { z } from 'zod';

// Heures GTFS : secondes depuis minuit de la date de service, pouvant dépasser 86 400
// (un train à « 25:10:00 » part à 1 h 10 le lendemain). Jamais converties en Date (CLAUDE.md § 3).

const SECONDES_PAR_JOUR = 86_400;

export type HeureAffichee = {
  /** « HH:MM », toujours entre 00:00 et 23:59 */
  texte: string;
  /** Vrai si l'heure tombe le lendemain de la date de service (affichée « (+1) ») */
  lendemain: boolean;
};

export function secondesVersHeure(secondes: number): HeureAffichee {
  if (!Number.isInteger(secondes) || secondes < 0) {
    throw new RangeError(`Heure GTFS invalide : ${secondes} s`);
  }
  const dansLaJournee = secondes % SECONDES_PAR_JOUR;
  const heures = Math.floor(dansLaJournee / 3600);
  const minutes = Math.floor((dansLaJournee % 3600) / 60);
  return {
    texte: `${String(heures).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    lendemain: secondes >= SECONDES_PAR_JOUR,
  };
}

/** Heure renvoyée par l'API (docs/05-api.md § 1.8) : secondes de la date de service + texte. */
export const schemaHeure = z.object({
  s: z.number().int(),
  texte: z.string(),
  lendemain: z.boolean(),
});

export type Heure = z.infer<typeof schemaHeure>;

export function heure(secondes: number): Heure {
  return { s: secondes, ...secondesVersHeure(secondes) };
}

export function heureOuNull(secondes: number | null | undefined): Heure | null {
  return secondes === null || secondes === undefined ? null : heure(secondes);
}

/**
 * Vrai si le train est déjà parti. Compté en secondes depuis minuit de la date de service, comme
 * l'horaire GTFS : à 00:30 le lendemain, un train à « 24:45 » est encore à venir (CLAUDE.md § 3).
 */
export function trainParti(
  secondes: number,
  dateService: string,
  maintenant: { dateDuJour: string; heureActuelleS: number },
): boolean {
  const jours = (Date.parse(maintenant.dateDuJour) - Date.parse(dateService)) / 86_400_000;
  return secondes < maintenant.heureActuelleS + jours * SECONDES_PAR_JOUR;
}
