// Les règles testées sont celles du vrai `regles/categories.csv` : le test vérifie aussi le fichier.
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { lireCsv } from '../src/chargement/base';
import { FICHIER_REGLES, schemaRegle } from '../src/chargement/regles';
import {
  classer,
  etiquettesNonClassees,
  indexerRegles,
  type IndexRegles,
  type RegleCategorie,
} from '../src/transformations/categories';
import { classesDe } from '../src/transformations/datatourisme';

const index: Record<'datatourisme' | 'osm', IndexRegles> = {
  datatourisme: indexerRegles([]),
  osm: indexerRegles([]),
};

beforeAll(async () => {
  const { lignes, bilan } = lireCsv(fileURLToPath(FICHIER_REGLES), schemaRegle, {
    delimiteur: ';',
    commentaire: '#',
  });
  const parSource: Record<string, RegleCategorie[]> = { datatourisme: [], osm: [] };
  for await (const r of lignes) {
    parSource[r.source]?.push({
      cle: r.cle,
      valeur: r.valeur,
      categorie: r.categorie,
      sousCategorie: r.sous_categorie,
      priorite: r.priorite,
      condition: r.condition,
    });
  }
  expect(bilan.rejets).toEqual([]);
  index.datatourisme = indexerRegles(parSource.datatourisme ?? []);
  index.osm = indexerRegles(parSource.osm ?? []);
});

const nomme = { aNom: true, notable: false };
const dt = (...classes: string[]) => classes.map((c) => ['categorie', c] as const);

describe('classer — DATAtourisme', () => {
  it('« musée » → patrimoine ; « hôtel » → exclu', () => {
    expect(classer(index.datatourisme, dt('PointOfInterest', 'Museum'), nomme)).toEqual({
      type: 'classe',
      categorie: 'patrimoine',
      sousCategorie: 'musée',
    });
    expect(classer(index.datatourisme, dt('PointOfInterest', 'Hotel'), nomme)).toEqual({
      type: 'exclu',
    });
  });
  it('un château qui est aussi un hôtel est exclu (exclusion forte)', () => {
    expect(classer(index.datatourisme, dt('Castle', 'Hotel'), nomme).type).toBe('exclu');
  });
  it('un circuit qui est aussi un site naturel reste en nature (exclusion faible)', () => {
    const solutre = dt('Tour', 'WalkingTour', 'NaturalCuriosity', 'Summit', 'PlaceOfInterest');
    expect(classer(index.datatourisme, solutre, nomme)).toMatchObject({ categorie: 'nature' });
  });
  it('seulement des étiquettes génériques → exclu', () => {
    expect(classer(index.datatourisme, dt('PointOfInterest', 'PlaceOfInterest'), nomme).type).toBe(
      'exclu',
    );
  });
  it('la règle précise l’emporte sur la règle large (musée avant site culturel)', () => {
    expect(classer(index.datatourisme, dt('CulturalSite', 'Museum'), nomme)).toMatchObject({
      sousCategorie: 'musée',
    });
  });
  it('bibliothèque, cinéma : écartés (compléments) ; cinéma qui est aussi un théâtre : gardé', () => {
    expect(classer(index.datatourisme, dt('Library', 'CulturalSite'), nomme).type).toBe('exclu');
    expect(classer(index.datatourisme, dt('Cinema', 'MovieTheater'), nomme).type).toBe('exclu');
    expect(
      classer(index.datatourisme, dt('Cinema', 'MovieTheater', 'Theater'), nomme),
    ).toMatchObject({ categorie: 'culture', sousCategorie: 'théâtre' });
  });
  it('une classe inconnue est signalée « non classée »', () => {
    expect(etiquettesNonClassees(index.datatourisme, dt('Museum', 'ClasseInventee'))).toEqual([
      'categorie=ClasseInventee',
    ]);
  });
});

describe('règles de la décision D057', () => {
  const adresse = (...classes: string[]) =>
    classes.map((c) => `https://www.datatourisme.fr/ontology/core#${c}`).join('|');

  it('piscine et balnéo → centre aquatique, ni piscine ni exclu', () => {
    const etiquettes = classesDe(adresse('SwimmingPool', 'BalneotherapyCentre'));
    expect(classer(index.datatourisme, etiquettes, nomme)).toMatchObject({
      type: 'classe',
      sousCategorie: 'centre aquatique',
    });
  });

  it('balnéo seul reste écarté (spa d’hôtel, massage) ; piscine seule reste une piscine', () => {
    const balneo = classesDe(adresse('BalneotherapyCentre'));
    expect(classer(index.datatourisme, balneo, nomme)).toEqual({ type: 'exclu' });
    const piscine = classesDe(adresse('SwimmingPool'));
    expect(classer(index.datatourisme, piscine, nomme)).toMatchObject({ sousCategorie: 'piscine' });
  });

  it('une gare classée monument historique est écartée ; un autre monument non', () => {
    const monument: [string, string][] = [
      ['historic', 'building'],
      ['ref:mhs', 'PA00000000'],
    ];
    expect(classer(index.osm, monument, nomme).type).toBe('classe');
    expect(classer(index.osm, [...monument, ['building', 'train_station']], nomme)).toEqual({
      type: 'exclu',
    });
  });
});

describe('classer — OSM', () => {
  it('leisure=playground → enfants, même sans nom ; amenity=restaurant → exclu', () => {
    expect(
      classer(index.osm, [['leisure', 'playground']], { aNom: false, notable: false }),
    ).toMatchObject({ type: 'classe', categorie: 'enfants' });
    expect(
      classer(
        index.osm,
        [
          ['amenity', 'restaurant'],
          ['historic', 'castle'],
        ],
        nomme,
      ).type,
    ).toBe('exclu');
  });
  it('une aire de jeux privée est exclue', () => {
    const privee = [
      ['leisure', 'playground'],
      ['access', 'private'],
    ] as const;
    expect(classer(index.osm, privee, { aNom: false, notable: false }).type).toBe('exclu');
  });
  it('un parc sans nom n’est pas gardé ; avec un nom, oui', () => {
    expect(classer(index.osm, [['leisure', 'park']], { aNom: false, notable: false }).type).toBe(
      'condition',
    );
    expect(classer(index.osm, [['leisure', 'park']], nomme)).toMatchObject({ categorie: 'parcs' });
  });
  it('plan d’eau nommé : gardé avec un signe de sortie, écarté sans', () => {
    const lac = [['natural', 'water']] as const;
    expect(classer(index.osm, lac, { aNom: true, notable: true })).toMatchObject({
      categorie: 'nature',
    });
    expect(classer(index.osm, lac, nomme).type).toBe('condition');
  });
  it('croix de chemin nommée : gardée si Monument historique, écartée sinon (même avec Wikidata)', () => {
    expect(
      classer(
        index.osm,
        [
          ['historic', 'wayside_cross'],
          ['ref:mhs', 'PA00112233'],
        ],
        nomme,
      ),
    ).toMatchObject({ categorie: 'patrimoine', sousCategorie: 'monument historique' });
    // Même avec un lien Wikidata (signe de sortie), le petit patrimoine non classé est écarté.
    const notable = { aNom: true, notable: true };
    expect(classer(index.osm, [['historic', 'wayside_cross']], notable).type).toBe('exclu');
    // Un autre élément historique notable reste gardé.
    expect(classer(index.osm, [['historic', 'mine']], notable)).toMatchObject({
      categorie: 'patrimoine',
    });
  });
  it('grotte nommée : gardée avec un signe de sortie, écartée sans', () => {
    const grotte = [['natural', 'cave_entrance']] as const;
    expect(classer(index.osm, grotte, { aNom: true, notable: true })).toMatchObject({
      categorie: 'nature',
      sousCategorie: 'grotte',
    });
    expect(classer(index.osm, grotte, nomme).type).toBe('condition');
  });
  it('aire de pique-nique seule : écartée ; dans un parc nommé : le parc reste gardé', () => {
    expect(classer(index.osm, [['tourism', 'picnic_site']], nomme).type).toBe('exclu');
    const parc = [
      ['leisure', 'park'],
      ['tourism', 'picnic_site'],
    ] as const;
    expect(classer(index.osm, parc, nomme)).toMatchObject({ categorie: 'parcs' });
  });
  it('école Monument historique : écartée ; château Monument historique qui abrite une école : gardé', () => {
    const ecole = [
      ['amenity', 'school'],
      ['ref:mhs', 'PA00112233'],
    ] as const;
    expect(classer(index.osm, ecole, nomme).type).toBe('exclu');
    expect(classer(index.osm, [...ecole, ['historic', 'castle']], nomme)).toMatchObject({
      categorie: 'patrimoine',
      sousCategorie: 'château',
    });
  });
});
