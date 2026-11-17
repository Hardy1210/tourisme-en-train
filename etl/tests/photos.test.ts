// Règles des photos des lieux (D100, D101) : une photo par lieu, crédit obligatoire, droits datés.
// Tests en paires : le cas et sa limite.
import { describe, expect, it } from 'vitest';
import {
  auteurLisible,
  choisirPhoto,
  droitsEnCours,
  estCartePostale,
  fichierCommons,
  licenceLibre,
  nomExclu,
  titreWikipediaFr,
  vignettesTourinsoft,
  type Candidat,
  type MetaCommons,
  type ReglesPhotos,
} from '../src/transformations/photos';

const regles: ReglesPhotos = {
  largeurPetitePx: 400,
  largeurGrandePx: 800,
  extensionsImages: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  motifsFichiersExclus: ['blason', 'carte', 'map', 'logo', 'locator'],
  motifsCartesPostales: ['postcard', 'post card', 'carte postale', 'cartes postales'],
  licencesLibres: [
    'cc by',
    'cc0',
    'public domain',
    'domaine public',
    'pd',
    'fal',
    'licence art libre',
  ],
  motifsLicencesRefusees: ['nc', 'nd'],
  auteursVides: ['unknown', 'unknown author', 'auteur inconnu', 'inconnu', 'anonymous', 'anonyme'],
};

describe('fichierCommons : nom du fichier Commons, quelle que soit la forme de l’adresse', () => {
  it('« File: », Special:FilePath, upload.wikimedia.org (vignette comprise), page du fichier', () => {
    expect(fichierCommons('File:Château de Bussy.jpg')).toBe('Château de Bussy.jpg');
    expect(
      fichierCommons(
        'https://commons.wikimedia.org/wiki/Special:FilePath/Ch%C3%A2teau%20de%20Bussy.jpg',
      ),
    ).toBe('Château de Bussy.jpg');
    expect(
      fichierCommons(
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Maison_du_bailli.jpg/800px-Maison_du_bailli.jpg',
      ),
    ).toBe('Maison du bailli.jpg');
    expect(fichierCommons('https://commons.wikimedia.org/wiki/File:Pont_de_pierre.jpg')).toBe(
      'Pont de pierre.jpg',
    );
  });

  it('limite : une image hébergée ailleurs n’est pas un fichier Commons (pas de crédit lisible)', () => {
    expect(fichierCommons('https://example.org/photo.jpg')).toBeNull();
    expect(fichierCommons('Category:Bussy')).toBeNull();
    expect(fichierCommons(null)).toBeNull();
  });
});

describe('titreWikipediaFr : seulement Wikipédia en français (1 935 articles sur 1 943, mesuré le 17/11)', () => {
  it('article français → titre', () => {
    expect(titreWikipediaFr('https://fr.wikipedia.org/wiki/Ch%C3%A2teau_de_Bussy-Rabutin')).toBe(
      'Château de Bussy-Rabutin',
    );
  });
  it('limite : autre langue ou absent → null', () => {
    expect(titreWikipediaFr('https://de.wikipedia.org/wiki/Burg_Bussy')).toBeNull();
    expect(titreWikipediaFr(null)).toBeNull();
  });
});

describe('licenceLibre', () => {
  it('CC BY-SA, CC BY, CC0, domaine public, Licence Art Libre : acceptées', () => {
    for (const licence of ['CC BY-SA 4.0', 'CC BY 3.0', 'CC0', 'Public domain', 'FAL']) {
      expect(licenceLibre(licence, regles)).toBe(true);
    }
  });
  it('limite : pas d’utilisation commerciale ou pas de modification, ou licence absente → refusée', () => {
    expect(licenceLibre('CC BY-NC 2.0', regles)).toBe(false);
    expect(licenceLibre('CC BY-ND 4.0', regles)).toBe(false);
    expect(licenceLibre('GFDL', regles)).toBe(false);
    expect(licenceLibre('', regles)).toBe(false);
  });
});

describe('auteurLisible : sans crédit lisible, pas de photo', () => {
  it('un nom d’auteur → lisible', () => {
    expect(auteurLisible('Chau7', regles)).toBe(true);
  });
  it('limite : vide ou « Unknown author » → illisible', () => {
    expect(auteurLisible('', regles)).toBe(false);
    expect(auteurLisible('  ', regles)).toBe(false);
    expect(auteurLisible('Unknown author', regles)).toBe(false);
  });
});

describe('nomExclu : SVG, autre format, ou nom avec Blason, Carte, Map, Logo, Locator (D101)', () => {
  it('écartés', () => {
    expect(nomExclu('Logo Musée de la Loire.jpg', regles)).toBe(true);
    expect(nomExclu('Blason ville fr Nolay.svg', regles)).toBe(true);
    expect(nomExclu('Poussignol sur la carte de Cassini.jpg', regles)).toBe(true);
    expect(nomExclu('Plan.pdf', regles)).toBe(true);
  });
  it('limite : une photo ordinaire passe', () => {
    expect(nomExclu('Château de Decize (3).JPG', regles)).toBe(false);
    expect(nomExclu('IMG-1953.jpeg', regles)).toBe(false);
  });
});

describe('estCartePostale (D101)', () => {
  it('par une catégorie Commons (photo n° 11 de la planche) ou par le nom', () => {
    expect(
      estCartePostale(
        'Château de Chazeu (Laizy).jpg',
        ['Category:Postcards of Arrondissement Autun'],
        regles,
      ),
    ).toBe(true);
    expect(estCartePostale('Bazarnes - carte postale.jpg', [], regles)).toBe(true);
  });
  it('limite : une photo sans catégorie ni nom de carte postale', () => {
    expect(
      estCartePostale(
        'Château de Chazeu (Laizy).jpg',
        ['Category:Château de Chazeu (Laizy)'],
        regles,
      ),
    ).toBe(false);
  });
});

// Été et hiver (règle 3 du projet) : les dates sont des jours AAAA-MM-JJ, sans heure ni fuseau.
describe('droitsEnCours : droits valides à la date du jour', () => {
  for (const jour of ['2026-07-15', '2026-11-17']) {
    it(`${jour} : droits sans dates, ou finissant ce jour, ou commençant ce jour → en cours`, () => {
      expect(droitsEnCours(null, null, jour)).toBe(true);
      expect(droitsEnCours(null, jour, jour)).toBe(true);
      expect(droitsEnCours(jour, null, jour)).toBe(true);
    });
  }
  it('limite : finis la veille, ou commençant le lendemain → pas en cours', () => {
    expect(droitsEnCours(null, '2026-11-16', '2026-11-17')).toBe(false);
    expect(droitsEnCours('2026-11-18', null, '2026-11-17')).toBe(false);
    expect(droitsEnCours(null, '2026-07-14', '2026-07-15')).toBe(false);
  });
});

describe('vignettesTourinsoft : jamais l’original (≈ 1,5 Mo), toujours ?width= (D100)', () => {
  it('deux tailles', () => {
    expect(
      vignettesTourinsoft('https://exemple.media.tourinsoft.eu/upload/Salle.jpg', regles),
    ).toEqual({
      petite: 'https://exemple.media.tourinsoft.eu/upload/Salle.jpg?width=400',
      grande: 'https://exemple.media.tourinsoft.eu/upload/Salle.jpg?width=800',
    });
  });
});

const meta = (fichier: string, autre: Partial<MetaCommons> = {}): [string, MetaCommons] => [
  fichier,
  {
    auteur: 'Chau7',
    licence: 'CC BY-SA 3.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    urlPetite: `https://upload.wikimedia.org/thumb/${fichier}/400px`,
    urlGrande: `https://upload.wikimedia.org/thumb/${fichier}/800px`,
    page: `https://commons.wikimedia.org/wiki/File:${fichier}`,
    categories: [],
    ...autre,
  },
];

describe('choisirPhoto : une seule photo par lieu, dans l’ordre OSM, Wikipédia, Wikidata, DATAtourisme', () => {
  const metas = new Map([
    meta('Osm.jpg'),
    meta('Article.jpg'),
    meta('Wikidata.jpg'),
    meta('SansAuteur.jpg', { auteur: '' }),
    meta('Carte postale.jpg'),
    meta('Chazeu.jpg', { categories: ['Category:Postcards of Arrondissement Autun'] }),
  ]);
  const dt: Candidat = {
    origine: 'datatourisme',
    media: {
      url: 'https://t.media.tourinsoft.eu/upload/a.jpg',
      credits: 'OT Beaune',
      debut: null,
      fin: null,
    },
  };
  const contexte = { metas, regles, exclues: new Set<string>(), dateDuJour: '2026-11-17' };

  it('la première photo valide gagne, même s’il en existe d’autres', () => {
    const { photo } = choisirPhoto(
      [
        { origine: 'osm', fichier: 'Osm.jpg' },
        { origine: 'wikipedia', fichier: 'Article.jpg' },
        dt,
      ],
      contexte,
    );
    expect(photo).toMatchObject({
      origine: 'osm',
      source: 'wikimedia_commons',
      fichier: 'Osm.jpg',
      auteur: 'Chau7',
      licence: 'CC BY-SA 3.0',
    });
  });

  it('une photo écartée passe la main à la suivante, avec sa raison', () => {
    const { photo, ecarts } = choisirPhoto(
      [
        { origine: 'osm', fichier: 'SansAuteur.jpg' },
        { origine: 'wikipedia', fichier: 'Carte postale.jpg' },
        { origine: 'wikipedia', fichier: 'Chazeu.jpg' },
        { origine: 'wikidata', fichier: 'Inconnue.jpg' },
        { origine: 'wikidata', fichier: 'Wikidata.jpg' },
      ],
      contexte,
    );
    expect(photo?.fichier).toBe('Wikidata.jpg');
    expect(ecarts.map((e) => e.raison)).toEqual([
      'sans_auteur',
      'nom_exclu',
      'carte_postale',
      'introuvable',
    ]);
  });

  it('exclue à la main (photos_exclues.csv) : le lieu n’est pas touché, il prend la source suivante', () => {
    const { photo, ecarts } = choisirPhoto([{ origine: 'osm', fichier: 'Osm.jpg' }, dt], {
      ...contexte,
      exclues: new Set(['Osm.jpg']),
    });
    expect(photo).toMatchObject({
      origine: 'datatourisme',
      source: 'datatourisme_photos',
      auteur: 'OT Beaune',
      licence: 'Licence Ouverte',
      page: null,
      urlGrande: 'https://t.media.tourinsoft.eu/upload/a.jpg?width=800',
    });
    expect(ecarts).toEqual([{ fichier: 'Osm.jpg', raison: 'exclue_a_la_main' }]);
  });

  it('DATAtourisme : sans crédit, ou droits expirés au chargement → écartée ; dates gardées sinon', () => {
    const sansCredit: Candidat = { ...dt, media: { ...dt.media, credits: ' ' } };
    const expiree: Candidat = { ...dt, media: { ...dt.media, fin: '2024-12-31' } };
    const datee: Candidat = {
      ...dt,
      media: { ...dt.media, debut: '2026-01-01', fin: '2027-06-30' },
    };
    expect(choisirPhoto([sansCredit], contexte).ecarts[0]?.raison).toBe('sans_auteur');
    expect(choisirPhoto([expiree], contexte).ecarts[0]?.raison).toBe('droits');
    expect(choisirPhoto([datee], contexte).photo).toMatchObject({
      droitsDebut: '2026-01-01',
      droitsFin: '2027-06-30',
    });
  });

  it('limite : aucune photo valide → null (le lieu garde l’icône de sa catégorie)', () => {
    expect(
      choisirPhoto([{ origine: 'osm', fichier: 'SansAuteur.jpg' }], contexte).photo,
    ).toBeNull();
    expect(choisirPhoto([], contexte).photo).toBeNull();
  });
});
