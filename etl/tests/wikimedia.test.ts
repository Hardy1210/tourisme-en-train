// Wikimedia (D100) : lecture des réponses de Wikidata, Wikipédia et Commons, et client qui respecte la
// politique de Wikimedia (nom de l'application et contact, une pause entre deux appels, délai demandé).
import { describe, expect, it, vi } from 'vitest';
import {
  chercherMetasCommons,
  creerClientWikimedia,
  userAgentWikimedia,
} from '../src/sources/wikimedia';
import {
  lireCategoriesCommons,
  lireImagesPages,
  lireInfosCommons,
  lireP18,
  texteSansBalises,
} from '../src/transformations/wikimedia';

const largeurs = { largeurPetitePx: 400, largeurGrandePx: 800 };

describe('lireP18 : image de la fiche Wikidata', () => {
  it('fichier de la propriété P18 ; une fiche sans P18 est absente', () => {
    const reponse = {
      entities: {
        Q1: { claims: { P18: [{ mainsnak: { datavalue: { value: 'Château_de_Bussy.jpg' } } }] } },
        Q2: { claims: {} },
        Q3: { missing: '' },
      },
    };
    expect(lireP18(reponse)).toEqual(new Map([['Q1', 'Château de Bussy.jpg']]));
  });
});

describe('lireImagesPages : image principale libre de l’article (pilicense=free)', () => {
  it('suit les titres normalisés et les redirections jusqu’au titre demandé', () => {
    const reponse = {
      query: {
        normalized: [{ from: 'Chateau_de_Bussy', to: 'Chateau de Bussy' }],
        redirects: [{ from: 'Chateau de Bussy', to: 'Château de Bussy-Rabutin' }],
        pages: [
          { title: 'Château de Bussy-Rabutin', pageimage: 'Bussy_Rabutin.jpg' },
          { title: 'Lavoir de Nolay' },
        ],
      },
    };
    expect(lireImagesPages(reponse, ['Chateau_de_Bussy', 'Lavoir de Nolay'])).toEqual(
      new Map([['Chateau_de_Bussy', 'Bussy Rabutin.jpg']]),
    );
  });
});

describe('texteSansBalises : l’auteur Commons arrive en HTML', () => {
  it('balises retirées, entités décodées, espaces resserrés', () => {
    expect(
      texteSansBalises(
        '<a href="//commons.wikimedia.org/wiki/User:Chau7">Chau7</a> &amp; <b>Ami</b>\n',
      ),
    ).toBe('Chau7 & Ami');
  });
});

// Réponses réelles du 17/11 : Commons ne sert plus que des tailles standard (demande 400 px → 500 px,
// 800 px → 960 px) sur thumb.wikimedia.org, avec des paramètres de suivi ; une adresse « 400px » construite
// à la main répond HTTP 400.
const vignette = (largeur: number, fichier: string) =>
  `https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/${fichier}/${largeur}px-${fichier}`;
const suivi = '?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail';

const reponseInfos = (largeurServie: number) => ({
  query: {
    normalized: [{ from: 'File:Couvent_Poligny.JPG', to: 'File:Couvent Poligny.JPG' }],
    pages: [
      {
        title: 'File:Couvent Poligny.JPG',
        imageinfo: [
          {
            thumburl: vignette(largeurServie, 'Couvent_Poligny.JPG') + suivi,
            url: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Couvent_Poligny.JPG',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Couvent_Poligny.JPG',
            extmetadata: {
              Artist: { value: '<a href="//commons.wikimedia.org/wiki/User:Chau7">Chau7</a>' },
              LicenseShortName: { value: 'CC BY-SA 3.0' },
              LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/3.0' },
            },
          },
        ],
      },
      {
        title: 'File:Petit.jpg',
        imageinfo: [
          {
            // Original plus petit que la taille demandée : Commons renvoie l'original.
            thumburl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Petit.jpg',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Petit.jpg',
            extmetadata: { Artist: { value: 'X' }, LicenseShortName: { value: 'CC0' } },
          },
        ],
      },
      { title: 'File:Absent.jpg', missing: true },
    ],
  },
});

describe('lireInfosCommons : auteur, licence, vignette servie par Commons et page de chaque fichier', () => {
  it('la vignette est l’adresse renvoyée par Commons, sans les paramètres de suivi', () => {
    expect(lireInfosCommons(reponseInfos(960)).get('Couvent Poligny.JPG')).toEqual({
      auteur: 'Chau7',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      vignette: vignette(960, 'Couvent_Poligny.JPG'),
      page: 'https://commons.wikimedia.org/wiki/File:Couvent_Poligny.JPG',
    });
  });

  it('limite : original plus petit → l’original ; fichier absent → ignoré', () => {
    const infos = lireInfosCommons(reponseInfos(960));
    expect(infos.get('Petit.jpg')).toMatchObject({
      vignette: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Petit.jpg',
      licenceUrl: null,
    });
    expect(infos.has('Absent.jpg')).toBe(false);
  });
});

describe('chercherMetasCommons : chaque taille est demandée à Commons, jamais déduite', () => {
  /** Faux Commons : la largeur demandée donne la taille standard servie ; les catégories à part. */
  const fauxCommons = async (_api: string, p: Record<string, string>) => {
    if (p.prop === 'categories')
      return { query: { pages: [{ title: 'File:Couvent Poligny.JPG' }] } };
    return reponseInfos(p.iiurlwidth === '400' ? 500 : 960);
  };

  it('petite = vignette servie pour la petite largeur, grande = pour la grande (bug du 17/11)', async () => {
    const metas = await chercherMetasCommons(
      fauxCommons,
      'https://commons.wikimedia.org/w/api.php',
      ['Couvent Poligny.JPG'],
      {
        taille: 50,
        ...largeurs,
      },
    );
    expect(metas.get('Couvent Poligny.JPG')).toMatchObject({
      urlPetite: vignette(500, 'Couvent_Poligny.JPG'),
      urlGrande: vignette(960, 'Couvent_Poligny.JPG'),
      categories: [],
    });
  });

  it('limite : original plus petit que les deux tailles → la même adresse pour les deux', async () => {
    const metas = await chercherMetasCommons(
      fauxCommons,
      'https://commons.wikimedia.org/w/api.php',
      ['Petit.jpg'],
      {
        taille: 50,
        ...largeurs,
      },
    );
    expect(metas.get('Petit.jpg')).toMatchObject({
      urlPetite: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Petit.jpg',
      urlGrande: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Petit.jpg',
    });
  });
});

describe('lireCategoriesCommons : catégories visibles, avec la suite à demander', () => {
  it('catégories par fichier et paramètres de suite', () => {
    const reponse = {
      continue: { clcontinue: '123|Postcards', continue: '||' },
      query: {
        pages: [
          {
            title: 'File:Chazeu.jpg',
            categories: [{ title: 'Category:Postcards of Arrondissement Autun' }],
          },
          { title: 'File:Pont.jpg' },
        ],
      },
    };
    expect(lireCategoriesCommons(reponse)).toEqual({
      categories: new Map([
        ['Chazeu.jpg', ['Category:Postcards of Arrondissement Autun']],
        ['Pont.jpg', []],
      ]),
      suite: { clcontinue: '123|Postcards', continue: '||' },
    });
  });
  it('limite : réponse complète → pas de suite', () => {
    expect(lireCategoriesCommons({ query: { pages: [] } }).suite).toBeNull();
  });
});

describe('client Wikimedia : la politique d’usage des API est respectée', () => {
  it('User-Agent : nom de l’application et contact (l’adresse du site), jamais une donnée personnelle', () => {
    expect(userAgentWikimedia('https://wagoo.hardylino.com')).toBe(
      'tourisme-en-train-etl/1.0 (https://wagoo.hardylino.com)',
    );
  });

  const reponseJson = (corps: unknown, statut = 200, entetes: Record<string, string> = {}) =>
    new Response(JSON.stringify(corps), { status: statut, headers: entetes });

  it('une pause entre deux appels, le User-Agent envoyé, les paramètres en format JSON', async () => {
    const appels: { url: string; ua: string | null }[] = [];
    const faux = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      appels.push({ url: String(url), ua: new Headers(init?.headers).get('User-Agent') });
      return reponseJson({ ok: true });
    });
    const attendre = vi.fn(async () => {});
    const appeler = creerClientWikimedia({
      userAgent: 'tourisme-en-train-etl/1.0 (https://wagoo.hardylino.com)',
      pauseMs: 1000,
      tentatives: 3,
      fetch: faux,
      attendre,
    });
    await appeler('https://www.wikidata.org/w/api.php', { action: 'wbgetentities', ids: 'Q1|Q2' });
    await appeler('https://www.wikidata.org/w/api.php', { action: 'wbgetentities', ids: 'Q3' });
    expect(appels).toHaveLength(2);
    expect(appels[0]?.ua).toBe('tourisme-en-train-etl/1.0 (https://wagoo.hardylino.com)');
    const url = new URL(appels[0]?.url ?? '');
    expect(url.searchParams.get('format')).toBe('json');
    expect(url.searchParams.get('formatversion')).toBe('2');
    expect(url.searchParams.get('ids')).toBe('Q1|Q2');
    // Pas d'attente avant le premier appel ; une pause avant le second.
    expect(attendre.mock.calls).toEqual([[1000]]);
  });

  it('429 : attend le délai Retry-After demandé, puis réessaie', async () => {
    const faux = vi
      .fn()
      .mockResolvedValueOnce(reponseJson({}, 429, { 'Retry-After': '7' }))
      .mockResolvedValueOnce(reponseJson({ ok: 1 }));
    const attendre = vi.fn(async () => {});
    const appeler = creerClientWikimedia({
      userAgent: 'x',
      pauseMs: 1000,
      tentatives: 3,
      fetch: faux,
      attendre,
    });
    await expect(appeler('https://commons.wikimedia.org/w/api.php', {})).resolves.toEqual({
      ok: 1,
    });
    expect(attendre.mock.calls).toEqual([[7000]]);
  });

  it('limite : toujours refusé après le nombre de tentatives → erreur (l’étape échoue, rien n’est remplacé)', async () => {
    const faux = vi.fn(async () => reponseJson({}, 503));
    const appeler = creerClientWikimedia({
      userAgent: 'x',
      pauseMs: 10,
      tentatives: 2,
      fetch: faux,
      attendre: async () => {},
    });
    await expect(appeler('https://commons.wikimedia.org/w/api.php', {})).rejects.toThrow(/503/);
    expect(faux).toHaveBeenCalledTimes(2);
  });
});
