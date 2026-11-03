// « Ce week-end » (docs/05-api.md § A.3) : date du samedi à proposer, à partir de la date du jour à Paris.
// Calcul de calendrier pur : la date arrive en paramètre (AAAA-MM-JJ), l'horloge n'est jamais lue.

const SAMEDI = 6;
const DIMANCHE = 0;

/** Lundi → samedi suivant · vendredi → lendemain · samedi et dimanche → aujourd'hui. */
export function debutDuWeekEnd(dateDuJour: string): string {
  const [annee, mois, jour] = dateDuJour.split('-').map(Number);
  if (annee === undefined || mois === undefined || jour === undefined) {
    throw new RangeError(`Date invalide : ${dateDuJour}`);
  }
  // Midi UTC : aucun changement d'heure ne peut faire glisser le jour (calcul de calendrier seul).
  const date = new Date(Date.UTC(annee, mois - 1, jour, 12));
  const jourSemaine = date.getUTCDay();
  if (jourSemaine === SAMEDI || jourSemaine === DIMANCHE) return dateDuJour;
  date.setUTCDate(date.getUTCDate() + (SAMEDI - jourSemaine));
  return date.toISOString().slice(0, 10);
}
