import { describe, expect, it } from 'vitest';
import { garesEnIcones } from './zoom-gares';

describe('garesEnIcones (D118 : environ 15 gares visibles autour de Dijon)', () => {
  it('au seuil et au-delà : des icônes de train', () => {
    expect(garesEnIcones(9.75, 9.75)).toBe(true);
    expect(garesEnIcones(12, 9.75)).toBe(true);
  });
  it('juste en dessous : des points', () => {
    expect(garesEnIcones(9.74, 9.75)).toBe(false);
  });
});
