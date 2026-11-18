import { describe, expect, it } from 'vitest';
import { formaterDistance, formaterDistanceVolOiseau, formaterDureeEstimee } from './formats';

describe('formaterDistance', () => {
  it('reste en mètres sous un kilomètre', () => {
    expect(formaterDistance(999)).toBe('999 m');
  });

  it('passe en kilomètres à partir de 1 000 m, avec une virgule', () => {
    expect(formaterDistance(1000)).toBe('1,0 km');
    expect(formaterDistance(6240)).toBe('6,2 km');
  });
});

describe('formaterDureeEstimee (D102)', () => {
  it('une durée estimée commence par « ≈ »', () => {
    expect(formaterDureeEstimee(9)).toBe('≈ 9 min');
  });
  it('limite : une minute, sans pluriel ni arrondi de plus', () => {
    expect(formaterDureeEstimee(1)).toBe('≈ 1 min');
  });
});

describe('formaterDistanceVolOiseau (D102)', () => {
  it('dit que la distance est à vol d’oiseau, en kilomètres', () => {
    expect(formaterDistanceVolOiseau(2900)).toBe("2,9 km à vol d'oiseau");
  });
  it('limite : sous un kilomètre, en mètres', () => {
    expect(formaterDistanceVolOiseau(999)).toBe("999 m à vol d'oiseau");
  });
});
