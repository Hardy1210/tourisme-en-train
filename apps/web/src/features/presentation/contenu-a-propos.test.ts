import { describe, expect, it } from 'vitest';
import {
  chiffresAffiches,
  comparaisonVoitureTer,
  seulementConfirmes,
  type ChiffreSource,
} from './contenu-a-propos';

const chiffre = (confirme: boolean): ChiffreSource => ({
  valeur: '1',
  texte: 'essai',
  sources: [{ libelle: 'essai', url: 'https://exemple.fr' }],
  confirme,
});

describe('chiffres de la page', () => {
  it('garde un chiffre confirmé, retire un chiffre non confirmé', () => {
    expect(seulementConfirmes([chiffre(true)])).toHaveLength(1);
    expect(seulementConfirmes([chiffre(false)])).toHaveLength(0);
  });

  it('calcule la comparaison depuis les facteurs : 14 kg contre 2,8 kg, ou plus de chiffre sans TER', () => {
    expect(comparaisonVoitureTer({ VOITURE: 142, TER: 27.7 })?.valeur).toBe('14 kg contre 2,8 kg');
    expect(comparaisonVoitureTer({ VOITURE: 142, TER: null })).toBeNull();
  });

  it('chaque chiffre affiché cite au moins une source en https', () => {
    const affiches = chiffresAffiches();
    expect(affiches.length).toBeGreaterThan(0);
    for (const { sources } of affiches) {
      expect(sources.length).toBeGreaterThan(0);
      for (const { url } of sources) expect(url).toMatch(/^https:\/\//);
    }
  });

  it('n’affiche pas les chiffres du bilan tant qu’ils ne sont pas confirmés', () => {
    expect(chiffresAffiches().map((c) => c.valeur)).toEqual(['14 kg contre 2,8 kg']);
  });
});
