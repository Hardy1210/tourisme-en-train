import { describe, expect, it } from 'vitest';
import { lireNomsExclus } from '../src/chargement/noms-exclus';
import { lireMotif, motifQuiExclut, texteComparable } from '../src/transformations/noms-exclus';

describe('noms exclus (regles/noms_exclus.csv, D045)', () => {
  const motifs = [
    lireMotif('^trésor de', 'objet'),
    lireMotif('^retable', 'objet'),
    lireMotif('escape game', 'activité'),
    lireMotif('fermé temporairement', 'fermé'),
  ];
  const raison = (nom: string) => motifQuiExclut(nom, motifs)?.raison ?? null;

  it('texte comparable : sans accents, majuscules ni ponctuation', () => {
    expect(texteComparable("FERMÉ TEMPORAIREMENT - L'Orgue")).toBe('ferme temporairement l orgue');
  });

  it('« ^trésor de » en début de nom : « Le trésor de la Cathédrale » écarté ; « Musée … - Trésor de Vix » gardé', () => {
    expect(raison('Le trésor de la Cathédrale Saint-Lazare')).toBe('objet');
    expect(raison('Musée du Pays Châtillonnais - Trésor de Vix')).toBeNull();
  });

  it('motif partout, par mots entiers : « Bees the Key - Escape Game » écarté ; « Château de Rosières » gardé', () => {
    expect(raison('Bees the Key - Escape Game')).toBe('activité');
    expect(raison('Château de Rosières')).toBeNull();
    // « retable » doit être un mot entier en début de nom : le pluriel n'est pas concerné.
    expect(raison("Retable de l'église Saint-Martin")).toBe('objet');
    expect(raison('Retables Saint-Cyr et Sainte-Juliette')).toBeNull();
  });

  it('« FERMÉ TEMPORAIREMENT - Musée du Vin » écarté ; « Ferme de la Borde » gardée', () => {
    expect(raison('FERMÉ TEMPORAIREMENT - Musée du Vin de Bourgogne')).toBe('fermé');
    expect(raison('Ferme de la Borde')).toBeNull();
  });

  it('le fichier du dépôt est lisible', async () => {
    const lus = await lireNomsExclus();
    expect(lus.length).toBeGreaterThan(0);
    expect(lus.find((m) => m.texte === 'tresor de')?.debut).toBe(true);
  });
});
