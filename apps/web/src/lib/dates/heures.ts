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
