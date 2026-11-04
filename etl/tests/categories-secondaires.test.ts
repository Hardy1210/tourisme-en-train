import { describe, expect, it } from 'vitest';
import { lireReglesSecondaires } from '../src/chargement/categories-secondaires';
import { categoriesSecondaires } from '../src/transformations/categories-secondaires';
import { classesDe } from '../src/transformations/datatourisme';

const regles = await lireReglesSecondaires();
const dt = (nom: string, categorie: string, ...classes: string[]) => ({
  source: 'datatourisme' as const,
  nom,
  categorie,
  etiquettes: classesDe(classes.map((c) => `https://x/core#${c}`).join('|')),
});
const osm = (nom: string, categorie: string, tags: Record<string, string>) => ({
  source: 'osm' as const,
  nom,
  categorie,
  etiquettes: Object.entries(tags),
});

describe('categoriesSecondaires', () => {
  it('une ferme pédagogique classée nature apparaît aussi en enfants', () => {
    expect(categoriesSecondaires(regles, dt('Ferme Malpas', 'nature', 'TeachingFarm'))).toEqual([
      'enfants',
    ]);
  });

  it('un simple sentier reste sans catégorie secondaire', () => {
    expect(
      categoriesSecondaires(regles, dt('Sentier des crêtes', 'nature', 'WalkingTour')),
    ).toEqual([]);
  });

  it('reconnaît un zoo par son tag OSM, une classe DATAtourisme n’y fait rien', () => {
    expect(categoriesSecondaires(regles, osm('Mini-zoo', 'parcs', { zoo: 'petting_zoo' }))).toEqual(
      ['enfants'],
    );
    expect(
      categoriesSecondaires(regles, osm('Domaine', 'parcs', { categorie: 'TeachingFarm' })),
    ).toEqual([]);
  });

  it('reconnaît un nom par mots entiers, sans majuscules ni accents', () => {
    expect(categoriesSecondaires(regles, dt('Parc Animalier de la Forêt', 'parcs'))).toEqual([
      'enfants',
    ]);
    expect(categoriesSecondaires(regles, dt('Zoom sur le patrimoine', 'patrimoine'))).toEqual([]);
  });

  it('n’ajoute jamais sa catégorie principale à un lieu', () => {
    expect(
      categoriesSecondaires(regles, dt('Ferme des Petits', 'enfants', 'TeachingFarm')),
    ).toEqual([]);
  });

  it('ne compte qu’une fois une catégorie atteinte par plusieurs règles', () => {
    expect(
      categoriesSecondaires(
        regles,
        dt('Base de loisirs du Lac', 'nature', 'LeisureComplex', 'PlayArea'),
      ),
    ).toEqual(['enfants']);
  });
});
