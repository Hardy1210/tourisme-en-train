import { describe, expect, it } from 'vitest';
import { lireCorrections } from '../src/chargement/corrections';
import { corrigerLieu, type CorrectionLieu } from '../src/transformations/corrections';
import type { LieuACharger } from '../src/transformations/lieux';

const LIEU: LieuACharger = {
  idSource: 'A',
  nom: 'Test',
  categorie: 'enfants',
  sousCategorie: 'base de loisirs',
  description: null,
  adresse: null,
  url: null,
  imageUrl: null,
  horaires: null,
  qualiteTourisme: false,
  lon: 5,
  lat: 47,
  trace: null,
  categoriesSecondaires: ['culture'],
};
const correction = (partiel: Partial<CorrectionLieu>): CorrectionLieu => ({
  source: 'datatourisme',
  idSource: 'A',
  action: 'reclasser',
  categorie: 'culture',
  sousCategorie: "jeu d'aventure",
  secondaires: null,
  ...partiel,
});

describe('corrigerLieu', () => {
  it('retire un lieu', () => {
    expect(corrigerLieu(LIEU, correction({ action: 'retirer' }))).toBeNull();
  });

  it('reclasse, sans garder en secondaire sa nouvelle catégorie principale', () => {
    expect(corrigerLieu(LIEU, correction({}))).toMatchObject({
      categorie: 'culture',
      sousCategorie: "jeu d'aventure",
      categoriesSecondaires: [],
    });
  });

  it('garde les secondaires par défaut', () => {
    const lieu = { ...LIEU, categoriesSecondaires: ['enfants'] };
    expect(corrigerLieu(lieu, correction({}))?.categoriesSecondaires).toEqual(['enfants']);
  });

  it('ajoute une catégorie demandée, même si la règle ne l’aurait pas gardée', () => {
    const lieu = { ...LIEU, categoriesSecondaires: [] };
    expect(
      corrigerLieu(lieu, correction({ secondaires: ['enfants'] }))?.categoriesSecondaires,
    ).toEqual(['enfants']);
  });

  it('les retire si la correction le demande', () => {
    const lieu = { ...LIEU, categoriesSecondaires: ['enfants'] };
    expect(corrigerLieu(lieu, correction({ secondaires: [] }))?.categoriesSecondaires).toEqual([]);
  });
});

describe('fichier corrections_manuelles.csv', () => {
  it('se lit sans erreur : les 6 lignes validées par Hardy', async () => {
    const corrections = await lireCorrections();
    expect(corrections).toHaveLength(6);
    expect(corrections.filter((c) => c.action === 'retirer')).toHaveLength(1);
    expect(corrections.filter((c) => c.secondaires?.length === 0)).toHaveLength(3);
    expect(corrections.filter((c) => c.secondaires?.includes('enfants'))).toHaveLength(1);
  });
});
