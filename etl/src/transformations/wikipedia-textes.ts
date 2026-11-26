// Textes Wikipédia des lieux (D123, docs/04-traitement-donnees.md § 4.6 quater) : lecture de la réponse de
// l'API et choix du texte d'un lieu. Fonctions pures, sans base ni réseau. Dans le doute, aucun texte :
// un lieu sans texte vaut mieux qu'un lieu avec le texte d'un autre.
import { z } from 'zod';
import { nettoyerDescription } from './description';
import { texteComparable } from './noms-exclus';

/** Article tel que l'API le décrit, indexé par le titre demandé (celui du tag OSM). */
export interface ArticleWikipedia {
  /** Titre après normalisation et redirection. */
  titre: string;
  existe: boolean;
  homonymie: boolean;
  /** Fiche Wikidata de l'article (`wikibase_item`). */
  wikidata: string | null;
  /** Adresse de l'article renvoyée par l'API. */
  lien: string | null;
  /** Introduction en texte brut, telle que l'API la donne. */
  extrait: string;
}

const schemaRenvois = z.array(z.object({ from: z.string(), to: z.string() })).optional();

const schemaReponse = z.object({
  query: z
    .object({
      normalized: schemaRenvois,
      redirects: schemaRenvois,
      pages: z
        .array(
          z.object({
            title: z.string(),
            missing: z.boolean().optional(),
            invalid: z.boolean().optional(),
            extract: z.string().optional(),
            fullurl: z.string().optional(),
            pageprops: z
              .object({
                wikibase_item: z.string().optional(),
                // Présent (chaîne vide) sur une page d'homonymie.
                disambiguation: z.string().optional(),
              })
              .optional(),
          }),
        )
        .default([]),
    })
    .optional(),
});

/** Titre demandé → article, en suivant normalisations et redirections. Un titre sans page : absent. */
export function lireArticles(
  reponse: unknown,
  titres: readonly string[],
): Map<string, ArticleWikipedia> {
  const query = schemaReponse.parse(reponse).query;
  const articles = new Map<string, ArticleWikipedia>();
  if (!query) return articles;
  const renvois = new Map(
    [...(query.normalized ?? []), ...(query.redirects ?? [])].map((r) => [r.from, r.to]),
  );
  const parTitre = new Map(query.pages.map((p) => [p.title, p]));
  for (const titre of titres) {
    let final = titre;
    for (let i = 0; i < 3 && renvois.has(final); i += 1) final = renvois.get(final) ?? final;
    const page = parTitre.get(final);
    if (!page) continue;
    articles.set(titre, {
      titre: page.title,
      existe: !page.missing && !page.invalid,
      homonymie: page.pageprops?.disambiguation !== undefined,
      wikidata: page.pageprops?.wikibase_item ?? null,
      lien: page.fullurl ?? null,
      extrait: page.extract ?? '',
    });
  }
  return articles;
}

export type RaisonEcartTexte =
  | 'section_d_article'
  | 'article_absent'
  | 'homonymie'
  | 'autre_fiche_wikidata'
  | 'article_de_la_commune'
  | 'texte_vide';

export const LIBELLES_ECART_TEXTE: Readonly<Record<RaisonEcartTexte, string>> = {
  section_d_article: "lien vers une section d'un article plus large",
  article_absent: 'article absent',
  homonymie: "page d'homonymie",
  autre_fiche_wikidata: 'autre fiche Wikidata que le lieu',
  article_de_la_commune: 'article de la commune du lieu',
  texte_vide: 'texte vide après nettoyage',
};

/** Lieu (ou doublon) qui apporte un article : ce qu'il faut pour vérifier que l'article parle de lui. */
export interface CandidatTexte {
  /** Titre demandé (tag OSM `wikipedia`, décodé). */
  titre: string;
  /** Fiche Wikidata du lieu (tag OSM `wikidata`). */
  wikidata: string | null;
  /** Nom de la commune du lieu. */
  commune: string | null;
}

export type Verdict =
  { texte: string; lien: string | null; titre: string } | { ecart: RaisonEcartTexte };

/** L'article parle-t-il bien de ce lieu ? Puis le texte nettoyé et coupé (D105). */
export function verifierArticle(
  candidat: CandidatTexte,
  article: ArticleWikipedia | undefined,
  maxCaracteres: number,
): Verdict {
  // « Bibracte#Organisation… » : l'introduction parle de tout l'article, pas de ce lieu (26/11 : 6 cas, dont
  // un puits de mine portant la fiche Wikidata de sa commune).
  if (candidat.titre.includes('#')) return { ecart: 'section_d_article' };
  if (!article?.existe) return { ecart: 'article_absent' };
  if (article.homonymie) return { ecart: 'homonymie' };
  if (candidat.wikidata !== null) {
    if (article.wikidata !== candidat.wikidata) return { ecart: 'autre_fiche_wikidata' };
  } else if (
    candidat.commune !== null &&
    // « Beaune (Côte-d'Or) » est aussi l'article de la commune.
    texteComparable(article.titre.replace(/\s*\([^)]*\)$/, '')) ===
      texteComparable(candidat.commune)
  ) {
    return { ecart: 'article_de_la_commune' };
  }
  const texte = nettoyerDescription(article.extrait, maxCaracteres);
  if (texte === null) return { ecart: 'texte_vide' };
  return { texte, lien: article.lien, titre: article.titre };
}

export interface ChoixTexte {
  retenu: { texte: string; lien: string | null; titre: string } | null;
  ecarts: { titre: string; raison: RaisonEcartTexte }[];
}

/** Le premier article valide du groupe (le lieu, puis ses doublons) ; les autres sont dits écartés. */
export function choisirTexte(
  candidats: readonly CandidatTexte[],
  articles: ReadonlyMap<string, ArticleWikipedia>,
  maxCaracteres: number,
): ChoixTexte {
  const ecarts: ChoixTexte['ecarts'] = [];
  for (const candidat of candidats) {
    const verdict = verifierArticle(candidat, articles.get(candidat.titre), maxCaracteres);
    if ('texte' in verdict) return { retenu: verdict, ecarts };
    ecarts.push({ titre: candidat.titre, raison: verdict.ecart });
  }
  return { retenu: null, ecarts };
}
