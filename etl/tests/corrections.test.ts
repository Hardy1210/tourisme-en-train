import { describe, expect, it } from 'vitest';
import { lireCorrections } from '../src/chargement/corrections';
import {
  corrigerLieu,
  inclusionsDe,
  retireParSousCategorie,
  type CorrectionLieu,
} from '../src/transformations/corrections';
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

describe('inclure (D091)', () => {
  it('garde le lieu avec la catégorie donnée, comme un reclassement', () => {
    expect(corrigerLieu(LIEU, correction({ action: 'inclure' }))).toMatchObject({
      categorie: 'culture',
      sousCategorie: "jeu d'aventure",
    });
  });

  it('donne la catégorie imposée aux seules lignes « inclure »', () => {
    const inclusion = inclusionsDe([
      correction({ idSource: 'A', action: 'inclure' }),
      correction({ idSource: 'B', action: 'reclasser' }),
      correction({ idSource: 'C', action: 'retirer', categorie: null }),
    ]);
    expect(inclusion('A')).toEqual({ categorie: 'culture', sousCategorie: "jeu d'aventure" });
    expect(inclusion('B')).toBeUndefined();
    expect(inclusion('C')).toBeUndefined();
    expect(inclusion('Z')).toBeUndefined();
  });
});

describe('retireParSousCategorie (D091)', () => {
  const RETIREES = ['piscine', 'centre aquatique'];

  it('retire une piscine, garde un parc aquatique', () => {
    expect(retireParSousCategorie('piscine', RETIREES, undefined)).toBe(true);
    expect(retireParSousCategorie('parc aquatique', RETIREES, undefined)).toBe(false);
    expect(retireParSousCategorie(null, RETIREES, undefined)).toBe(false);
  });

  it('une correction manuelle passe avant : une piscine incluse ou reclassée reste', () => {
    expect(retireParSousCategorie('piscine', RETIREES, correction({ action: 'inclure' }))).toBe(
      false,
    );
    expect(retireParSousCategorie('piscine', RETIREES, correction({}))).toBe(false);
    expect(
      retireParSousCategorie(
        'piscine',
        RETIREES,
        correction({ action: 'retirer', categorie: null }),
      ),
    ).toBe(true);
  });
});
