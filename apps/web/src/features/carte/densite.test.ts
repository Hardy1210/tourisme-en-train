// Densité de la carte (audit C, règle de Hardy du 18/11) : celle de l'écran, plafonnée par `carte.densiteMax`.
import { describe, expect, it } from 'vitest';
import { densiteCarte } from './densite';

describe('densiteCarte', () => {
  it('un écran plus dense que le plafond (iPhone ×3) est ramené au plafond', () => {
    expect(densiteCarte(3, 2)).toBe(2);
  });
  it('limite : un écran au plafond ou moins dense garde sa densité', () => {
    expect(densiteCarte(2, 2)).toBe(2);
    expect(densiteCarte(1.5, 2)).toBe(1.5);
    expect(densiteCarte(1, 2)).toBe(1);
  });
  it('une densité illisible (navigateur ancien, serveur) vaut 1', () => {
    expect(densiteCarte(Number.NaN, 2)).toBe(1);
    expect(densiteCarte(0, 2)).toBe(1);
    expect(densiteCarte(undefined, 2)).toBe(1);
  });
});
