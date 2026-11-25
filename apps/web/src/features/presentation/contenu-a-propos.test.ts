import { describe, expect, it } from 'vitest';
import {
  ceQueCaChange,
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

  it('affiche le bilan confirmé, sans les 11 % d’un autre périmètre', () => {
    const valeurs = chiffresAffiches().map((c) => c.valeur);
    expect(valeurs).toEqual(['97 Mt CO₂e', '69 %', '14 kg contre 2,8 kg']);
    expect(valeurs.join(' ')).not.toContain('11 %');
  });
});

describe('« Ce que ça change »', () => {
  it('la phrase du CO₂ vient des facteurs : 2,8 kg en TER contre 14 kg en voiture', () => {
    const phrases = ceQueCaChange({ VOITURE: 142, TER: 27.7 });
    expect(phrases).toHaveLength(3);
    expect(phrases[2]).toContain('environ 2,8 kg en TER, contre 14 kg en voiture seul');
  });
  it('limite : sans facteur TER, pas de phrase chiffrée', () => {
    const phrases = ceQueCaChange({ VOITURE: 142, TER: null });
    expect(phrases).toHaveLength(2);
    expect(phrases.join(' ')).not.toMatch(/kg/);
  });
});
