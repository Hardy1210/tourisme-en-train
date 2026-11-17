// Appels aux API de Wikimedia (Wikidata, Wikipédia, Commons) pour les photos des lieux (D100).
// Politique de Wikimedia : un User-Agent avec le nom de l'application et un contact (l'adresse du site,
// jamais une donnée personnelle), des appels espacés, le délai `Retry-After` respecté (L73).
import { journal } from '@tourisme/commun';
import { ErreurTelechargement } from './base';
import {
  lireCategoriesCommons,
  lireImagesPages,
  lireInfosCommons,
  lireP18,
} from '../transformations/wikimedia';
import type { MetaCommons } from '../transformations/photos';

/** Serveur saturé ou en panne passagère : on réessaie après le délai demandé. */
const STATUTS_PASSAGERS = new Set([429, 502, 503, 504]);

export function userAgentWikimedia(contact: string): string {
  return `tourisme-en-train-etl/1.0 (${contact})`;
}

export type AppelWikimedia = (api: string, parametres: Record<string, string>) => Promise<unknown>;

export function creerClientWikimedia(options: {
  userAgent: string;
  pauseMs: number;
  tentatives: number;
  fetch?: typeof fetch;
  attendre?: (ms: number) => Promise<void>;
}): AppelWikimedia {
  const recuperer = options.fetch ?? fetch;
  const attendre = options.attendre ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)));
  let premier = true;
  return async (api, parametres) => {
    const adresse = new URL(api);
    for (const [cle, valeur] of Object.entries({
      ...parametres,
      format: 'json',
      formatversion: '2',
    })) {
      adresse.searchParams.set(cle, valeur);
    }
    if (!premier) await attendre(options.pauseMs);
    premier = false;
    for (let tentative = 1; ; tentative += 1) {
      const reponse = await recuperer(adresse, { headers: { 'User-Agent': options.userAgent } });
      if (reponse.ok) return (await reponse.json()) as unknown;
      if (!STATUTS_PASSAGERS.has(reponse.status) || tentative >= options.tentatives) {
        throw new ErreurTelechargement(reponse.status, `${adresse.origin}${adresse.pathname}`);
      }
      const delaiS = Number(reponse.headers.get('Retry-After'));
      const attenteMs =
        Number.isFinite(delaiS) && delaiS > 0 ? delaiS * 1000 : options.pauseMs * 2 ** tentative;
      journal.info('Wikimedia demande d’attendre', { statut: reponse.status, attenteMs });
      await attendre(attenteMs);
    }
  };
}

function* paquets<T>(liste: readonly T[], taille: number): Generator<T[]> {
  for (let i = 0; i < liste.length; i += taille) yield liste.slice(i, i + taille);
}

/** Fiche Wikidata → fichier de sa propriété « image » (P18). */
export async function chercherP18(
  appeler: AppelWikimedia,
  api: string,
  qids: readonly string[],
  taille: number,
): Promise<Map<string, string>> {
  const images = new Map<string, string>();
  for (const paquet of paquets([...new Set(qids)].sort(), taille)) {
    const reponse = await appeler(api, {
      action: 'wbgetentities',
      ids: paquet.join('|'),
      props: 'claims',
    });
    for (const [qid, fichier] of lireP18(reponse)) images.set(qid, fichier);
  }
  return images;
}

/** Titre d'article → image principale **libre** de l'article (`pilicense=free`). */
export async function chercherImagesPages(
  appeler: AppelWikimedia,
  api: string,
  titres: readonly string[],
  taille: number,
): Promise<Map<string, string>> {
  const images = new Map<string, string>();
  for (const paquet of paquets([...new Set(titres)].sort(), taille)) {
    const reponse = await appeler(api, {
      action: 'query',
      prop: 'pageimages',
      piprop: 'name',
      pilicense: 'free',
      redirects: '1',
      titles: paquet.join('|'),
    });
    for (const [titre, fichier] of lireImagesPages(reponse, paquet)) images.set(titre, fichier);
  }
  return images;
}

/** Fichier Commons → auteur, licence, vignettes, page et catégories visibles. */
export async function chercherMetasCommons(
  appeler: AppelWikimedia,
  api: string,
  fichiers: readonly string[],
  options: { taille: number; largeurPetitePx: number; largeurGrandePx: number },
): Promise<Map<string, MetaCommons>> {
  const metas = new Map<string, MetaCommons>();
  for (const paquet of paquets([...new Set(fichiers)].sort(), options.taille)) {
    const titres = paquet.map((f) => `File:${f}`).join('|');
    // Une demande par taille : Commons choisit la taille standard et renvoie son adresse (bug du 17/11).
    const infosPour = async (largeur: number) =>
      lireInfosCommons(
        await appeler(api, {
          action: 'query',
          prop: 'imageinfo',
          iiprop: 'extmetadata|url',
          iiurlwidth: String(largeur),
          iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl',
          titles: titres,
        }),
      );
    const grandes = await infosPour(options.largeurGrandePx);
    const petites = await infosPour(options.largeurPetitePx);
    // Les catégories peuvent arriver en plusieurs réponses (`continue`) : on les rassemble.
    const categories = new Map<string, string[]>();
    let suite: Record<string, string> | null = {};
    while (suite) {
      const lu = lireCategoriesCommons(
        await appeler(api, {
          action: 'query',
          prop: 'categories',
          clshow: '!hidden',
          cllimit: 'max',
          titles: titres,
          ...suite,
        }),
      );
      for (const [fichier, liste] of lu.categories) {
        categories.set(fichier, [...(categories.get(fichier) ?? []), ...liste]);
      }
      suite = lu.suite;
    }
    for (const [fichier, { vignette, ...credit }] of grandes) {
      metas.set(fichier, {
        ...credit,
        urlGrande: vignette,
        urlPetite: petites.get(fichier)?.vignette ?? vignette,
        categories: categories.get(fichier) ?? [],
      });
    }
  }
  return metas;
}
