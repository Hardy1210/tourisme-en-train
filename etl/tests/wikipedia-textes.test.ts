// Textes Wikipédia des lieux (D123) : lecture de la réponse de l'API et contrôles « l'article parle-t-il
// bien de ce lieu ? ». Dans le doute, aucun texte. Tests en paires : le cas et sa limite.
import { describe, expect, it } from 'vitest';
import {
  choisirTexte,
  lireArticles,
  verifierArticle,
  type ArticleWikipedia,
} from '../src/transformations/wikipedia-textes';

// Réponse réelle réduite (API Wikipédia, 26/11/2026), plus une page absente et une homonymie.
const REPONSE = {
  query: {
    normalized: [{ from: 'Lion_de_Belfort', to: 'Lion de Belfort' }],
    redirects: [{ from: 'Château Thoraise', to: 'Château de Thoraise' }],
    pages: [
      {
        title: 'Lion de Belfort',
        fullurl: 'https://fr.wikipedia.org/wiki/Lion_de_Belfort',
        pageprops: { wikibase_item: 'Q926536' },
        extract:
          'Le Lion de Belfort est un monument commémoratif en haut-relief situé à Belfort, en France.',
      },
      {
        title: 'Château de Thoraise',
        fullurl: 'https://fr.wikipedia.org/wiki/Ch%C3%A2teau_de_Thoraise',
        pageprops: { wikibase_item: 'Q2970791' },
        extract: 'Le château de Thoraise est un château situé à Thoraise, dans le Doubs.',
      },
      { title: 'Puits couvert', missing: true },
      {
        title: 'Saint-Martin',
        pageprops: { wikibase_item: 'Q1', disambiguation: '' },
        extract: 'Saint-Martin peut désigner :',
      },
    ],
  },
};

const article = (autre: Partial<ArticleWikipedia> = {}): ArticleWikipedia => ({
  titre: 'Château de Thoraise',
  existe: true,
  homonymie: false,
  wikidata: 'Q2970791',
  lien: 'https://fr.wikipedia.org/wiki/Ch%C3%A2teau_de_Thoraise',
  extrait: 'Le château de Thoraise est un château situé à Thoraise.',
  ...autre,
});
const candidat = { titre: 'Château de Thoraise', wikidata: 'Q2970791', commune: 'Thoraise' };

describe('lireArticles', () => {
  it('suit normalisations et redirections jusqu’à l’article ; lit fiche Wikidata, adresse et texte', () => {
    const lus = lireArticles(REPONSE, ['Lion_de_Belfort', 'Château Thoraise']);
    expect(lus.get('Lion_de_Belfort')).toMatchObject({
      titre: 'Lion de Belfort',
      existe: true,
      homonymie: false,
      wikidata: 'Q926536',
    });
    expect(lus.get('Château Thoraise')?.titre).toBe('Château de Thoraise');
  });

  it('limite : page absente → existe faux ; homonymie repérée ; titre inconnu de la réponse → absent', () => {
    const lus = lireArticles(REPONSE, ['Puits couvert', 'Saint-Martin', 'Inconnu']);
    expect(lus.get('Puits couvert')?.existe).toBe(false);
    expect(lus.get('Saint-Martin')?.homonymie).toBe(true);
    expect(lus.has('Inconnu')).toBe(false);
  });

  it('limite : une réponse qui change de forme fait échouer l’étape', () => {
    expect(() => lireArticles({ query: { pages: [{ titre: 'x' }] } }, ['x'])).toThrow();
  });
});

describe('verifierArticle : l’article parle-t-il bien de ce lieu ?', () => {
  it('même fiche Wikidata que le lieu → texte retenu, avec le lien de l’article', () => {
    expect(verifierArticle(candidat, article(), 2000)).toEqual({
      texte: 'Le château de Thoraise est un château situé à Thoraise.',
      lien: 'https://fr.wikipedia.org/wiki/Ch%C3%A2teau_de_Thoraise',
      titre: 'Château de Thoraise',
    });
  });

  it('limite : autre fiche Wikidata (le tag OSM désigne un autre sujet) → écarté', () => {
    expect(verifierArticle(candidat, article({ wikidata: 'Q999' }), 2000)).toEqual({
      ecart: 'autre_fiche_wikidata',
    });
    expect(verifierArticle(candidat, article({ wikidata: null }), 2000)).toEqual({
      ecart: 'autre_fiche_wikidata',
    });
  });

  it('lien vers une section (« Bethoncourt#Les_mines_de_fer ») → écarté, même avec la même fiche Wikidata', () => {
    // Vu le 26/11 : un puits de mine dont le tag OSM `wikidata` est celui de la commune.
    const section = {
      titre: 'Bethoncourt#Les mines de fer',
      wikidata: 'Q1',
      commune: 'Bethoncourt',
    };
    expect(
      verifierArticle(section, article({ titre: 'Bethoncourt', wikidata: 'Q1' }), 2000),
    ).toEqual({ ecart: 'section_d_article' });
  });

  it('article absent ou page d’homonymie → écarté', () => {
    expect(verifierArticle(candidat, undefined, 2000)).toEqual({ ecart: 'article_absent' });
    expect(verifierArticle(candidat, article({ existe: false }), 2000)).toEqual({
      ecart: 'article_absent',
    });
    expect(verifierArticle(candidat, article({ homonymie: true }), 2000)).toEqual({
      ecart: 'homonymie',
    });
  });

  it('sans fiche Wikidata : l’article de la commune du lieu → écarté, même avec « (Côte-d’Or) »', () => {
    const sansFiche = { titre: 'Beaune', wikidata: null, commune: 'Beaune' };
    expect(verifierArticle(sansFiche, article({ titre: 'Beaune' }), 2000)).toEqual({
      ecart: 'article_de_la_commune',
    });
    expect(verifierArticle(sansFiche, article({ titre: "Beaune (Côte-d'Or)" }), 2000)).toEqual({
      ecart: 'article_de_la_commune',
    });
  });

  it('limite : sans fiche Wikidata, un article qui n’est pas celui de la commune → retenu', () => {
    const sansFiche = { titre: 'Hospices de Beaune', wikidata: null, commune: 'Beaune' };
    expect(
      verifierArticle(sansFiche, article({ titre: 'Hospices de Beaune', wikidata: null }), 2000),
    ).toMatchObject({ titre: 'Hospices de Beaune' });
  });

  it('texte vide après nettoyage → écarté ; texte trop long → coupé à une fin de phrase (D105)', () => {
    expect(verifierArticle(candidat, article({ extrait: '  \n ' }), 2000)).toEqual({
      ecart: 'texte_vide',
    });
    const long = 'Première phrase du texte. Deuxième phrase un peu plus longue que la première.';
    const verdict = verifierArticle(candidat, article({ extrait: long }), 30);
    expect(verdict).toMatchObject({ texte: 'Première phrase du texte. …' });
  });
});

describe('choisirTexte : le lieu, puis ses doublons', () => {
  it('un doublon apporte l’article valide quand celui du lieu est écarté', () => {
    const articles = new Map([
      ['Saint-Martin', article({ titre: 'Saint-Martin', homonymie: true })],
      ['Château de Thoraise', article()],
    ]);
    const choix = choisirTexte(
      [{ titre: 'Saint-Martin', wikidata: null, commune: 'Thoraise' }, candidat],
      articles,
      2000,
    );
    expect(choix.retenu?.titre).toBe('Château de Thoraise');
    expect(choix.ecarts).toEqual([{ titre: 'Saint-Martin', raison: 'homonymie' }]);
  });

  it('limite : aucun article valide → aucun texte', () => {
    const choix = choisirTexte([candidat], new Map(), 2000);
    expect(choix.retenu).toBeNull();
    expect(choix.ecarts).toEqual([{ titre: 'Château de Thoraise', raison: 'article_absent' }]);
  });
});
