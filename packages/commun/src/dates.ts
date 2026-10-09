// Les DEUX seules fonctions du projet qui lisent l'horloge (CLAUDE.md § 3, D031).
// Elles calculent la date et l'heure à Paris, quel que soit le fuseau du serveur (Docker est en UTC).
// L'instant est un paramètre facultatif : les tests le fixent, le code appelant ne le passe jamais.
import { parametres } from './parametres';

const FORMAT_PARIS = new Intl.DateTimeFormat('fr-FR', {
  timeZone: parametres.fuseau,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export type Maintenant = {
  /** Date du jour à Paris, AAAA-MM-JJ */
  dateDuJour: string;
  /** Heure actuelle à Paris, en secondes depuis minuit (0 → 86 399) */
  heureActuelleS: number;
};

export function maintenantParis(instant: Date = new Date()): Maintenant {
  const morceaux = Object.fromEntries(
    FORMAT_PARIS.formatToParts(instant).map((morceau) => [morceau.type, morceau.value]),
  );
  return {
    dateDuJour: `${morceaux.year}-${morceaux.month}-${morceaux.day}`,
    heureActuelleS:
      Number(morceaux.hour) * 3600 + Number(morceaux.minute) * 60 + Number(morceaux.second),
  };
}

/** Date du jour à Paris, au format AAAA-MM-JJ. */
export function dateDuJour(instant: Date = new Date()): string {
  return maintenantParis(instant).dateDuJour;
}
