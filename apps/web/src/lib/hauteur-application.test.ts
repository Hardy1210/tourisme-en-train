import { describe, expect, it } from 'vitest';
import { hauteurApplication } from './hauteur-application';

const iphone = { standaloneIos: true, paysage: false, largeur: 390, hauteur: 844 };

describe('hauteurApplication', () => {
  it('prend toute la hauteur de l’écran dans l’application installée sur iPhone', () => {
    expect(hauteurApplication(iphone)).toBe(844);
  });
  it('suit la rotation, même si iOS ne change pas les dimensions de l’écran', () => {
    expect(hauteurApplication({ ...iphone, paysage: true })).toBe(390);
  });
  it('ne change rien ailleurs : Safari, Android, ordinateur', () => {
    expect(hauteurApplication({ ...iphone, standaloneIos: false })).toBeNull();
  });
});
