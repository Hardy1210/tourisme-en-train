import { describe, expect, it } from 'vitest';
import { apresGlissement, apresToucher, SEUIL_GLISSEMENT_PX } from './position-feuille';

describe('apresGlissement', () => {
  it('monte vers le haut et descend vers le bas, d’un cran', () => {
    expect(apresGlissement('milieu', -SEUIL_GLISSEMENT_PX)).toBe('plein');
    expect(apresGlissement('milieu', SEUIL_GLISSEMENT_PX)).toBe('carte');
  });

  it('ignore un geste trop court', () => {
    expect(apresGlissement('milieu', SEUIL_GLISSEMENT_PX - 1)).toBe('milieu');
    expect(apresGlissement('milieu', 1 - SEUIL_GLISSEMENT_PX)).toBe('milieu');
  });

  it('s’arrête aux extrémités', () => {
    expect(apresGlissement('plein', -200)).toBe('plein');
    expect(apresGlissement('carte', 200)).toBe('carte');
  });
});

describe('apresToucher', () => {
  it('bascule entre le milieu et le plein écran', () => {
    expect(apresToucher('milieu')).toBe('plein');
    expect(apresToucher('plein')).toBe('milieu');
  });

  it('remonte la feuille depuis la carte plein écran', () => {
    expect(apresToucher('carte')).toBe('milieu');
  });
});
