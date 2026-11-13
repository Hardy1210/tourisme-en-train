import { describe, expect, it } from 'vitest';
import {
  distanceMarcheM,
  dureeMarcheDepuisAPiedMin,
  dureeMarcheMin,
  dureeVeloDepuisDistanceMin,
  niveauAcces,
  dureeVeloMin,
  dureeVoitureMin,
  rayonVolOiseauM,
} from './distances';

// Paramètres du dépôt (`acces`, D091) : marche 4,5 km/h, vélo 15 km/h, voiture 50 km/h, détour 1,3 partout ;
// à pied jusqu'à 2 000 m, à vélo jusqu'à 6 000 m (distances déjà mesurées avec le détour).
describe('distances et durées', () => {
  it('distance à pied = vol d’oiseau × 1,3', () => {
    expect(distanceMarcheM(1000)).toBe(1300);
    expect(distanceMarcheM(0)).toBe(0);
  });

  it('à pied : 75 m par minute ; 1 500 m à vol d’oiseau (1 950 m) → 26 min, 1 442 m → 25 min', () => {
    expect(dureeMarcheMin(1500)).toBe(26);
    expect(dureeMarcheMin(1442)).toBe(25);
  });

  it('arrondi au-dessus : 1 m → 1 min, 0 m → 0 min', () => {
    expect(dureeMarcheMin(1)).toBe(1);
    expect(dureeMarcheMin(0)).toBe(0);
  });

  it('vélo et voiture : 6 km → 32 min à vélo, 10 min en voiture', () => {
    expect(dureeVeloMin(6000)).toBe(32);
    expect(dureeVoitureMin(6000)).toBe(10);
  });

  it('distance déjà à pied : 750 m → 10 min ; 751 m → 11 min (pas de second détour)', () => {
    expect(dureeMarcheDepuisAPiedMin(750)).toBe(10);
    expect(dureeMarcheDepuisAPiedMin(751)).toBe(11);
  });

  it('rayon à vol d’oiseau : 1 300 m à pied → 1 000 m', () => {
    expect(rayonVolOiseauM(1300)).toBeCloseTo(1000);
    expect(distanceMarcheM(rayonVolOiseauM(2000))).toBe(2000);
  });

  it('vélo, distance déjà mesurée : 250 m par minute ; 4 000 m → 16 min, 4 001 m → 17 min', () => {
    expect(dureeVeloDepuisDistanceMin(4000)).toBe(16);
    expect(dureeVeloDepuisDistanceMin(4001)).toBe(17);
  });

  it('rayon à pied : 2 000 m → 27 min à 4,5 km/h', () => {
    expect(dureeMarcheDepuisAPiedMin(2000)).toBe(27);
  });
});

describe('niveauAcces', () => {
  it('à pied jusqu’à 2 000 m compris, à vélo dès 2 001 m', () => {
    expect(niveauAcces(0)).toBe('pied');
    expect(niveauAcces(2000)).toBe('pied');
    expect(niveauAcces(2001)).toBe('velo');
  });

  it('à vélo jusqu’à 6 000 m compris, loin dès 6 001 m', () => {
    expect(niveauAcces(6000)).toBe('velo');
    expect(niveauAcces(6001)).toBe('loin');
  });
});
