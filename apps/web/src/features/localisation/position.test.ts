import { describe, expect, it } from 'vitest';
import { etatDepuisErreur } from './position';

describe('etatDepuisErreur', () => {
  it('distingue un refus de l’utilisateur', () => {
    expect(etatDepuisErreur(1)).toEqual({ etat: 'refusee' });
  });

  it('traite le reste comme une position indisponible (délai, pas de signal)', () => {
    expect(etatDepuisErreur(2)).toEqual({ etat: 'indisponible' });
    expect(etatDepuisErreur(3)).toEqual({ etat: 'indisponible' });
  });
});
