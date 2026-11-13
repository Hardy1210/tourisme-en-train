// Distances et durées à pied, à vélo, en voiture, à partir d'une distance à vol d'oiseau
// (docs/04-traitement-donnees.md § 6). Fonctions pures : aucune base, aucun réseau.
import { parametres } from '@/config/parametres';

export type ModeDeplacement = 'marche' | 'velo' | 'voiture';

const { acces, voiture } = parametres;

/** Vitesse et détour de chaque mode : marche et vélo dans `acces` (D091), voiture à part (CO₂). */
const MODES: Readonly<Record<ModeDeplacement, { vitesseKmH: number; coefDetour: number }>> = {
  marche: { vitesseKmH: acces.vitessePiedKmH, coefDetour: acces.coefDetour },
  velo: { vitesseKmH: acces.vitesseVeloKmH, coefDetour: acces.coefDetour },
  voiture,
};

/** Distance réellement parcourue (m) = vol d'oiseau × coefficient de détour du mode. */
export function distanceParcourueM(volOiseauM: number, mode: ModeDeplacement): number {
  return Math.round(volOiseauM * MODES[mode].coefDetour);
}

/** Durée (min, arrondie au-dessus) = vol d'oiseau × détour ÷ vitesse du mode. */
export function dureeMin(volOiseauM: number, mode: ModeDeplacement): number {
  const metresParMinute = (MODES[mode].vitesseKmH * 1000) / 60;
  return Math.ceil((volOiseauM * MODES[mode].coefDetour) / metresParMinute);
}

export const distanceMarcheM = (volOiseauM: number): number =>
  distanceParcourueM(volOiseauM, 'marche');
export const dureeMarcheMin = (volOiseauM: number): number => dureeMin(volOiseauM, 'marche');
export const dureeVeloMin = (volOiseauM: number): number => dureeMin(volOiseauM, 'velo');
export const dureeVoitureMin = (volOiseauM: number): number => dureeMin(volOiseauM, 'voiture');

/** Durée de marche (min) pour une distance **déjà mesurée à pied** (`lieu_gare`, `mobilite_locale`). */
export function dureeMarcheDepuisAPiedMin(distanceAPiedM: number): number {
  return Math.ceil(distanceAPiedM / ((acces.vitessePiedKmH * 1000) / 60));
}

/** Durée à vélo (min) pour une distance déjà mesurée avec le détour (même formule qu'à pied). */
export function dureeVeloDepuisDistanceMin(distanceM: number): number {
  return Math.ceil(distanceM / ((acces.vitesseVeloKmH * 1000) / 60));
}

export type NiveauAcces = 'pied' | 'velo' | 'loin';

/**
 * Comment rejoindre un lieu depuis la gare (D091), d'après sa distance déjà mesurée avec le détour :
 * « pied » jusqu'à `acces.rayonPiedM` compris, « velo » jusqu'à `acces.rayonVeloM` compris, sinon « loin ».
 */
export function niveauAcces(distanceM: number): NiveauAcces {
  if (distanceM <= acces.rayonPiedM) return 'pied';
  if (distanceM <= acces.rayonVeloM) return 'velo';
  return 'loin';
}

/** Rayon à vol d'oiseau qui correspond à une distance à pied (filtre SQL `ST_DWithin`, D043). */
export function rayonVolOiseauM(distanceAPiedM: number): number {
  return distanceAPiedM / acces.coefDetour;
}
