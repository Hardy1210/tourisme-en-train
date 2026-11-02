import { describe, expect, it } from 'vitest';
import { indexerRegles, type RegleCategorie } from '../src/transformations/categories';
import {
  classesDe,
  lireLigneDatatourisme,
  siteDesContacts,
  type LigneDatatourisme,
} from '../src/transformations/datatourisme';
import {
  estNotable,
  imageDe,
  lireElementOsm,
  requetesOverpass,
  traceDe,
  type ElementOsm,
} from '../src/transformations/osm';

const regle = (r: Partial<RegleCategorie> & Pick<RegleCategorie, 'cle' | 'valeur'>) =>
  ({ categorie: null, sousCategorie: null, priorite: 20, condition: null, ...r }) as RegleCategorie;

describe('DATAtourisme', () => {
  it('classesDe : fin de chaque adresse, sans doublon', () => {
    expect(
      classesDe(
        'https://www.datatourisme.fr/ontology/core#Museum|http://schema.org/Product|https://www.datatourisme.fr/ontology/core#Museum',
      ),
    ).toEqual([
      ['categorie', 'Museum'],
      ['categorie', 'Product'],
    ]);
  });

  it('siteDesContacts : le site propre plutôt que le réseau social', () => {
    expect(
      siteDesContacts(
        '#https://www.facebook.com/musee<>https://www.musee.fr/visite|03 80 00 00 00#',
      ),
    ).toBe('https://www.musee.fr/visite');
    expect(siteDesContacts('#https://www.facebook.com/musee')).toBe(
      'https://www.facebook.com/musee',
    );
    expect(siteDesContacts('#|#')).toBeNull();
  });

  const index = indexerRegles([
    regle({ cle: 'categorie', valeur: 'Museum', categorie: 'patrimoine', sousCategorie: 'musée' }),
    regle({ cle: 'categorie', valeur: 'Hotel', priorite: 10 }),
  ]);
  const ligne: LigneDatatourisme = {
    Nom_du_POI: 'MUSÉE DES BEAUX-ARTS',
    Categories_de_POI: 'https://www.datatourisme.fr/ontology/core#Museum',
    Latitude: 47.32,
    Longitude: 5.04,
    Adresse_postale: '1 place de la Libération',
    Contacts_du_POI: '#https://musees.dijon.fr',
    Classements_du_POI: 'Qualité Tourisme#Qualité Tourisme',
    Description: '<p>Un des plus anciens musées de France.</p>',
    URI_ID_du_POI: 'https://data.datatourisme.fr/1/abc',
  };

  it('ligne classée → lieu normalisé (nom, description, site, Qualité Tourisme)', () => {
    expect(lireLigneDatatourisme(ligne, index, 500)).toEqual({
      type: 'lieu',
      nonClassees: [],
      lieu: {
        idSource: 'https://data.datatourisme.fr/1/abc',
        nom: 'Musée des Beaux-Arts',
        categorie: 'patrimoine',
        sousCategorie: 'musée',
        description: 'Un des plus anciens musées de France.',
        adresse: '1 place de la Libération',
        url: 'https://musees.dijon.fr/',
        imageUrl: null,
        horaires: null,
        qualiteTourisme: true,
        lon: 5.04,
        lat: 47.32,
        trace: null,
      },
    });
  });

  it('ligne d’hôtel → écartée', () => {
    const hotel = {
      ...ligne,
      Categories_de_POI: 'https://www.datatourisme.fr/ontology/core#Hotel',
    };
    expect(lireLigneDatatourisme(hotel, index, 500)).toMatchObject({
      type: 'ecarte',
      raison: 'exclu',
    });
  });
});

describe('OSM', () => {
  const regles = [
    regle({
      cle: 'leisure',
      valeur: 'playground',
      categorie: 'enfants',
      sousCategorie: 'aire de jeux',
      condition: 'sans_nom',
    }),
    regle({ cle: 'historic', valeur: '*', categorie: 'patrimoine', condition: 'notable' }),
    regle({ cle: 'amenity', valeur: 'restaurant', priorite: 10 }),
  ];

  it('requetesOverpass : une requête par règle qui classe, région par code INSEE, nom exigé sauf sans_nom', () => {
    const requetes = requetesOverpass(
      [...regles, regle({ cle: 'historic', valeur: 'castle', categorie: 'patrimoine' })],
      '27',
      180,
    );
    // historic=castle (nom exigé) est couvert par historic=* : pas de requête en plus ; aucune pour l'exclusion.
    expect(requetes.map((r) => r.filtre)).toEqual([
      '["historic"]["name"]',
      '["leisure"="playground"]',
    ]);
    const [historique] = requetes;
    expect(historique?.requete).toContain('[timeout:180]');
    expect(historique?.requete).toContain('["ref:INSEE"="27"]');
    expect(historique?.requete).toContain('nwr["historic"]["name"](area.region);');
    expect(historique?.requete).toContain('out center tags;');
  });

  it('requetesOverpass : lieu en longueur → lignes seulement, avec tracé ; les autres gardent le centre', () => {
    const canal = regle({
      cle: 'waterway',
      valeur: 'canal',
      categorie: 'nature',
      condition: 'notable',
    });
    const requetes = requetesOverpass([...regles, canal], '27', 180, ['waterway=canal']);
    const ligne = requetes.find((r) => r.filtre === 'way["waterway"="canal"]["name"]');
    expect(ligne?.requete).toContain('way["waterway"="canal"]["name"](area.region);');
    expect(ligne?.requete).toContain('out geom tags;');
    expect(requetes.find((r) => r.filtre === '["leisure"="playground"]')?.requete).toContain(
      'out center tags;',
    );
  });

  it('estNotable : Wikipédia, Monument historique, baignade oui ; nom seul non', () => {
    expect(estNotable({ name: 'Lac des Settons', wikipedia: 'fr:Lac des Settons' })).toBe(true);
    expect(estNotable({ 'ref:mhs': 'PA00112233' })).toBe(true);
    expect(estNotable({ sport: 'swimming' })).toBe(true);
    expect(estNotable({ name: 'Étang du Moulin' })).toBe(false);
  });

  it('imageDe : tag image, sinon fichier Wikimedia Commons', () => {
    expect(imageDe({ image: 'https://example.org/a.jpg' })).toBe('https://example.org/a.jpg');
    expect(imageDe({ wikimedia_commons: 'File:Château de Bussy.jpg' })).toBe(
      'https://commons.wikimedia.org/wiki/Special:FilePath/Ch%C3%A2teau%20de%20Bussy.jpg',
    );
    expect(imageDe({ wikimedia_commons: 'Category:Bussy' })).toBeNull();
  });

  const index = indexerRegles(regles);
  const aire: ElementOsm = {
    type: 'node',
    id: 42,
    lat: 47.3,
    lon: 5.0,
    tags: { leisure: 'playground' },
  };

  it('aire de jeux sans nom → nom « Aire de jeux », identifiant type/id', () => {
    expect(lireElementOsm(aire, index, 500)).toMatchObject({
      type: 'lieu',
      lieu: { idSource: 'node/42', nom: 'Aire de jeux', categorie: 'enfants' },
    });
  });

  it('surface : position au centre ; sans position → écartée', () => {
    const parc: ElementOsm = {
      type: 'way',
      id: 7,
      center: { lat: 47.1, lon: 4.9 },
      tags: { leisure: 'playground', name: 'Square' },
    };
    expect(lireElementOsm(parc, index, 500)).toMatchObject({ lieu: { lat: 47.1, lon: 4.9 } });
    expect(lireElementOsm({ ...parc, center: undefined }, index, 500)).toMatchObject({
      type: 'ecarte',
      raison: 'sans_position',
    });
  });

  it('ligne avec tracé : trace GeoJSON et point au milieu du tracé ; point seul : pas de trace', () => {
    const regleCanal = regle({ cle: 'waterway', valeur: 'canal', categorie: 'nature' });
    const canal: ElementOsm = {
      type: 'way',
      id: 9,
      geometry: [
        { lat: 47.0, lon: 5.0 },
        { lat: 47.1, lon: 5.1 },
        { lat: 47.2, lon: 5.2 },
      ],
      tags: { waterway: 'canal', name: 'Canal de Test' },
    };
    const lu = lireElementOsm(canal, indexerRegles([regleCanal]), 500);
    expect(lu).toMatchObject({ type: 'lieu', lieu: { lon: 5.1, lat: 47.1 } });
    const trace = lu.type === 'lieu' ? lu.lieu.trace : null;
    expect(JSON.parse(trace ?? 'null')).toEqual({
      type: 'LineString',
      coordinates: [
        [5.0, 47.0],
        [5.1, 47.1],
        [5.2, 47.2],
      ],
    });
    expect(traceDe(aire)).toBeNull();
  });
});
