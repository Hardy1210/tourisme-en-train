import { describe, expect, it } from 'vitest';
import {
  distanceMarcheM,
  dureeMarcheMin,
  dureeVeloMin,
  dureeVoitureMin,
  rayonVolOiseauM,
} from './distances';

// Paramètres du dépôt : marche 4,5 km/h, vélo 15 km/h, voiture 50 km/h, détour 1,3 partout.
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

  it('rayon à vol d’oiseau : 1 300 m à pied → 1 000 m', () => {
    expect(rayonVolOiseauM(1300)).toBeCloseTo(1000);
    expect(distanceMarcheM(rayonVolOiseauM(2000))).toBe(2000);
  });
});
