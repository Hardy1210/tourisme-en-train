// Tranche de temps de trajet (couleur de la carte, légende) : `<=30`, `<=60`, `<=90`, `>90`,
// bornes lues dans `durees.tranchesTempsMin` (docs/04-traitement-donnees.md § 6, D055).
import { parametres } from '@/config/parametres';

export type TrancheTemps = `<=${number}` | `>${number}`;

export function trancheTemps(
  dureeMin: number,
  bornes: readonly number[] = parametres.durees.tranchesTempsMin,
): TrancheTemps {
  const borne = bornes.find((b) => dureeMin <= b);
  if (borne !== undefined) return `<=${borne}`;
  const derniere = bornes.at(-1);
  if (derniere === undefined) throw new RangeError('Aucune borne de tranche de temps');
  return `>${derniere}`;
}
