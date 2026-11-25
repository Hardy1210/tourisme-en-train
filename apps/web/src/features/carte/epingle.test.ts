import { describe, expect, it } from 'vitest';
import { formeEpingle } from './epingle';

describe('formeEpingle (épingle des lieux, D119)', () => {
  const normale = formeEpingle(30);
  const touchee = formeEpingle(40);

  it('la pointe est en bas, au milieu : c’est elle qui marque le lieu', () => {
    expect(normale.chemin.startsWith(`M${normale.cx} ${normale.hauteur - 1}`)).toBe(true);
    expect(normale.cx).toBe(normale.largeur / 2);
  });
  it('le cercle est en haut, la pointe en dessous : plus haute que large', () => {
    expect(normale.hauteur).toBeGreaterThan(normale.largeur);
    expect(normale.cy).toBeLessThan(normale.hauteur / 2);
  });
  it('le lieu touché a une épingle plus grande, la normale non', () => {
    expect(touchee.largeur).toBeGreaterThan(normale.largeur);
    expect(touchee.hauteur).toBeGreaterThan(normale.hauteur);
  });
});
