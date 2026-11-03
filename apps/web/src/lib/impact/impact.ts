// CO₂ et prix estimé d'une liaison (docs/04-traitement-donnees.md § 6, D010, D011, D047, D048).
// Fonctions pures, partagées par /api/destinations et /api/impact : aucune base, aucun réseau.
import type { TypeTrain } from '@tourisme/commun';

import { parametres, type Parametres } from '@/config/parametres';

type TypeTarife = Exclude<TypeTrain, 'AUTRE'>;

export type PrixEstime = { min: number; max: number; devise: 'EUR' };

export type Impact = {
  /** Aller-retour, en kg ; `train` à null si le facteur du type n'est pas relevé. */
  co2Kg: {
    train: number | null;
    voitureSeule: number;
    voiturePartagee: number;
    avion: number | null;
  };
  co2EconomiseKg: number | null;
  /** Aller simple ; null tant que le prix est à calibrer. */
  prixEstime: PrixEstime | null;
};

const arrondi1 = (n: number): number => Math.round(n * 10) / 10;

/** Types connus d'une liaison (`AUTRE` n'a ni facteur ni prix). */
function typesTarifes(typesTrain: readonly TypeTrain[]): TypeTarife[] {
  return typesTrain.filter((t): t is TypeTarife => t !== 'AUTRE');
}

/**
 * Valeur la plus haute parmi les types de la liaison : facteur CO₂ le moins favorable (D047),
 * prix le plus cher. null si aucun type connu, ou si l'un d'eux n'a pas de valeur (prudence).
 */
function laPlusHaute(
  typesTrain: readonly TypeTrain[],
  valeurs: Record<TypeTarife, number | null>,
): number | null {
  const types = typesTarifes(typesTrain);
  if (types.length === 0) return null;
  const lues = types.map((t) => valeurs[t]);
  const connues = lues.filter((v): v is number => v !== null);
  return connues.length === lues.length ? Math.max(...connues) : null;
}

/** kg de CO₂ pour un aller-retour de `distanceKm` à `gParKm`. */
const co2AllerRetourKg = (distanceKm: number, gParKm: number): number =>
  arrondi1((2 * distanceKm * gParKm) / 1000);

export function impactLiaison(
  distanceKm: number,
  typesTrain: readonly TypeTrain[],
  p: Pick<Parametres, 'impact' | 'prix'> = parametres,
): Impact {
  const facteurs = p.impact.facteursCo2GParKm;
  const facteurTrain = laPlusHaute(typesTrain, facteurs);
  const train = facteurTrain === null ? null : co2AllerRetourKg(distanceKm, facteurTrain);
  const voitureSeule = co2AllerRetourKg(distanceKm, facteurs.VOITURE);
  const avion =
    facteurs.AVION !== null && distanceKm >= p.impact.distanceMinAvionKm
      ? co2AllerRetourKg(distanceKm, facteurs.AVION)
      : null;

  return {
    co2Kg: {
      train,
      voitureSeule,
      voiturePartagee: arrondi1(voitureSeule / p.impact.occupantsVoiturePartagee),
      avion,
    },
    co2EconomiseKg: train === null ? null : arrondi1(voitureSeule - train),
    prixEstime: prixEstime(distanceKm, typesTrain, p),
  };
}

export function prixEstime(
  distanceKm: number,
  typesTrain: readonly TypeTrain[],
  p: Pick<Parametres, 'prix'> = parametres,
): PrixEstime | null {
  if (p.prix.aCalibrer) return null;
  const parKm = laPlusHaute(typesTrain, p.prix.parKm);
  if (parKm === null) return null;
  const prix = distanceKm * parKm;
  const marge = p.prix.margeFourchette;
  return {
    min: Math.max(1, Math.round(prix * (1 - marge))),
    max: Math.max(1, Math.round(prix * (1 + marge))),
    devise: 'EUR',
  };
}
