// Distances et durées à pied, à vélo, en voiture, à partir d'une distance à vol d'oiseau
// (docs/04-traitement-donnees.md § 6). Fonctions pures : aucune base, aucun réseau.
import { parametres } from '@/config/parametres';

export type ModeDeplacement = 'marche' | 'velo' | 'voiture';

/** Distance réellement parcourue (m) : vol d'oiseau × coefficient de détour du mode. */
export function distanceParcourueM(volOiseauM: number, mode: ModeDeplacement): number {
  return Math.round(volOiseauM * parametres[mode].coefDetour);
}

/** Durée (min, arrondie au-dessus) pour parcourir une distance à vol d'oiseau. */
export function dureeMin(volOiseauM: number, mode: ModeDeplacement): number {
  const metresParMinute = (parametres[mode].vitesseKmH * 1000) / 60;
  return Math.ceil((volOiseauM * parametres[mode].coefDetour) / metresParMinute);
}

export const distanceMarcheM = (volOiseauM: number): number =>
  distanceParcourueM(volOiseauM, 'marche');
export const dureeMarcheMin = (volOiseauM: number): number => dureeMin(volOiseauM, 'marche');
export const dureeVeloMin = (volOiseauM: number): number => dureeMin(volOiseauM, 'velo');
export const dureeVoitureMin = (volOiseauM: number): number => dureeMin(volOiseauM, 'voiture');

/** Durée de marche (min) pour une distance **déjà mesurée à pied** (`lieu_gare`, `mobilite_locale`). */
export function dureeMarcheDepuisAPiedMin(distanceAPiedM: number): number {
  return Math.ceil(distanceAPiedM / ((parametres.marche.vitesseKmH * 1000) / 60));
}

/** Rayon à vol d'oiseau qui correspond à une distance à pied (filtre SQL `ST_DWithin`, D043). */
export function rayonVolOiseauM(distanceAPiedM: number): number {
  return distanceAPiedM / parametres.marche.coefDetour;
}
