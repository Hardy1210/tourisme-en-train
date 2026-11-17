// Lecture des réponses de Wikidata, Wikipédia et Commons (D100). Chaque réponse est validée par Zod :
// une réponse qui change de forme fait échouer l'étape au lieu de charger des photos sans crédit.
// Fonctions pures, testées sur des réponses réelles réduites.
import { z } from 'zod';

/** Titre MediaWiki → nom de fichier lisible (« File:Pont_de_pierre.jpg » → « Pont de pierre.jpg »). */
const nomDeFichier = (titre: string): string =>
  titre
    .replace(/^(?:File|Fichier):/, '')
    .replaceAll('_', ' ')
    .trim();

const schemaRenvois = z.array(z.object({ from: z.string(), to: z.string() })).optional();

const schemaP18 = z.object({
  entities: z.record(
    z.string(),
    z.object({
      claims: z
        .record(
          z.string(),
          z.array(
            z.object({
              mainsnak: z.object({ datavalue: z.object({ value: z.unknown() }).optional() }),
            }),
          ),
        )
        .optional(),
    }),
  ),
});

/** Fiche Wikidata → fichier de sa propriété « image » (P18). */
export function lireP18(reponse: unknown): Map<string, string> {
  const images = new Map<string, string>();
  for (const [qid, fiche] of Object.entries(schemaP18.parse(reponse).entities)) {
    const valeur = fiche.claims?.P18?.[0]?.mainsnak.datavalue?.value;
    if (typeof valeur === 'string' && valeur.trim()) images.set(qid, nomDeFichier(valeur));
  }
  return images;
}

const schemaPages = z.object({
  query: z
    .object({
      normalized: schemaRenvois,
      redirects: schemaRenvois,
      pages: z.array(z.object({ title: z.string(), pageimage: z.string().optional() })).default([]),
    })
    .optional(),
});

/** Titre demandé → image principale libre de l'article, en suivant normalisations et redirections. */
export function lireImagesPages(reponse: unknown, titres: readonly string[]): Map<string, string> {
  const query = schemaPages.parse(reponse).query;
  const images = new Map<string, string>();
  if (!query) return images;
  const renvois = new Map(
    [...(query.normalized ?? []), ...(query.redirects ?? [])].map((r) => [r.from, r.to]),
  );
  const parTitre = new Map(query.pages.map((p) => [p.title, p.pageimage]));
  for (const titre of titres) {
    let final = titre;
    for (let i = 0; i < 3 && renvois.has(final); i += 1) final = renvois.get(final) ?? final;
    const image = parTitre.get(final);
    if (image) images.set(titre, nomDeFichier(image));
  }
  return images;
}

const ENTITES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
};

/** L'auteur Commons arrive en HTML (liens vers la page de l'auteur) : texte seul, espaces resserrés. */
export function texteSansBalises(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entite, nom: string) => {
      if (ENTITES[nom]) return ENTITES[nom];
      if (/^#x/i.test(nom)) return String.fromCodePoint(Number.parseInt(nom.slice(2), 16));
      if (nom.startsWith('#')) return String.fromCodePoint(Number(nom.slice(1)));
      return entite;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

const schemaValeur = z.object({ value: z.unknown() }).optional();
const schemaInfos = z.object({
  query: z
    .object({
      normalized: schemaRenvois,
      pages: z
        .array(
          z.object({
            title: z.string(),
            missing: z.unknown().optional(),
            imageinfo: z
              .array(
                z.object({
                  thumburl: z.string().optional(),
                  url: z.string().optional(),
                  descriptionurl: z.string(),
                  extmetadata: z
                    .object({
                      Artist: schemaValeur,
                      LicenseShortName: schemaValeur,
                      LicenseUrl: schemaValeur,
                    })
                    .default({}),
                }),
              )
              .optional(),
          }),
        )
        .default([]),
    })
    .optional(),
});

const texteDe = (v: { value: unknown } | undefined): string =>
  typeof v?.value === 'string' ? texteSansBalises(v.value) : '';

/** Ce que Commons dit d'un fichier pour une largeur demandée : crédit, page et vignette servie. */
export interface InfoCommons {
  auteur: string;
  licence: string;
  licenceUrl: string | null;
  /** Vignette **servie par Commons** (taille standard), sans les paramètres de suivi ; l'original s'il est plus petit. */
  vignette: string;
  page: string;
}

/** Adresse sans ses paramètres (`?utm_source=…` ajoutés par Commons). */
const sansParametres = (url: string): string => url.split('?')[0] ?? url;

/**
 * Fichier → auteur, licence, page et vignette pour la largeur demandée (`iiurlwidth`). Depuis 2025, Commons
 * ne sert que des tailles standard (400 → 500 px, 800 → 960 px, sur thumb.wikimedia.org) : l'adresse se
 * prend telle que Commons la renvoie, jamais construite à la main (une adresse « 400px » répond HTTP 400).
 */
export function lireInfosCommons(reponse: unknown): Map<string, InfoCommons> {
  const infos = new Map<string, InfoCommons>();
  const query = schemaInfos.parse(reponse).query;
  if (!query) return infos;
  const demandes = new Map((query.normalized ?? []).map((r) => [r.to, r.from]));
  for (const page of query.pages) {
    const info = page.imageinfo?.[0];
    if (page.missing !== undefined || !info) continue;
    const vignette = info.thumburl ?? info.url;
    if (!vignette) continue;
    const licenceUrl = texteDe(info.extmetadata.LicenseUrl);
    infos.set(nomDeFichier(demandes.get(page.title) ?? page.title), {
      auteur: texteDe(info.extmetadata.Artist),
      licence: texteDe(info.extmetadata.LicenseShortName),
      licenceUrl: licenceUrl.startsWith('http') ? licenceUrl : null,
      vignette: sansParametres(vignette),
      page: info.descriptionurl,
    });
  }
  return infos;
}

const schemaCategories = z.object({
  continue: z.record(z.string(), z.string()).optional(),
  query: z
    .object({
      normalized: schemaRenvois,
      pages: z
        .array(
          z.object({
            title: z.string(),
            categories: z.array(z.object({ title: z.string() })).optional(),
          }),
        )
        .default([]),
    })
    .optional(),
});

/** Fichier → catégories visibles ; `suite` = paramètres à renvoyer tant que Commons n'a pas tout donné. */
export function lireCategoriesCommons(reponse: unknown): {
  categories: Map<string, string[]>;
  suite: Record<string, string> | null;
} {
  const lu = schemaCategories.parse(reponse);
  const demandes = new Map((lu.query?.normalized ?? []).map((r) => [r.to, r.from]));
  const categories = new Map<string, string[]>();
  for (const page of lu.query?.pages ?? []) {
    categories.set(
      nomDeFichier(demandes.get(page.title) ?? page.title),
      (page.categories ?? []).map((c) => c.title),
    );
  }
  return { categories, suite: lu.continue ?? null };
}
