// Règles des photos des lieux (docs/04-traitement-donnees.md § 4.6 bis, D100, D101) : une photo par lieu,
// crédit lisible obligatoire, licence libre, droits datés. Fonctions pures : ni base, ni réseau, ni horloge
// (la date du jour arrive en paramètre).
import type { OriginePhoto } from '@tourisme/commun';
import { texteComparable } from './noms-exclus';

/** Section `photos` de config/parametres.json, sans les réglages d'appel aux API. */
export interface ReglesPhotos {
  largeurPetitePx: number;
  largeurGrandePx: number;
  extensionsImages: readonly string[];
  motifsFichiersExclus: readonly string[];
  motifsCartesPostales: readonly string[];
  licencesLibres: readonly string[];
  motifsLicencesRefusees: readonly string[];
  auteursVides: readonly string[];
}

/** Ce que Commons dit d'un fichier : crédit, vignettes, page et catégories visibles. */
export interface MetaCommons {
  auteur: string;
  licence: string;
  licenceUrl: string | null;
  urlPetite: string;
  urlGrande: string;
  page: string;
  categories: readonly string[];
}

/** Photo d'une fiche DATAtourisme, telle que l'export la décrit (crédit et dates parfois absents). */
export interface MediaDatatourisme {
  url: string;
  credits: string | null;
  /** AAAA-MM-JJ. */
  debut: string | null;
  fin: string | null;
}

export type Candidat =
  | { origine: Exclude<OriginePhoto, 'datatourisme'>; fichier: string }
  | { origine: 'datatourisme'; media: MediaDatatourisme };

export type SourcePhoto = 'wikimedia_commons' | 'datatourisme_photos';

export interface PhotoChoisie {
  origine: OriginePhoto;
  source: SourcePhoto;
  /** Nom du fichier Commons, ou adresse de l'original DATAtourisme (ce que vise photos_exclues.csv). */
  fichier: string;
  urlPetite: string;
  urlGrande: string;
  auteur: string;
  licence: string;
  licenceUrl: string | null;
  page: string | null;
  droitsDebut: string | null;
  droitsFin: string | null;
}

export type RaisonEcartPhoto =
  | 'introuvable'
  | 'format'
  | 'sans_auteur'
  | 'licence'
  | 'nom_exclu'
  | 'carte_postale'
  | 'exclue_a_la_main'
  | 'droits';

export const LIBELLES_ECART_PHOTO: Readonly<Record<RaisonEcartPhoto, string>> = {
  introuvable: 'fichier inconnu de Commons',
  format: 'pas une photo (SVG, PDF, TIFF…)',
  sans_auteur: 'auteur ou crédit illisible',
  licence: 'licence absente ou pas libre',
  nom_exclu: 'nom de fichier écarté (blason, carte, plan, logo…)',
  carte_postale: 'carte postale ancienne',
  exclue_a_la_main: 'écartée à la main (regles/photos_exclues.csv)',
  droits: 'droits d’utilisation expirés ou pas commencés',
};

/** Nom de fichier Commons (espaces, pas de soulignés) d'une forme d'adresse connue ; null sinon. */
export function fichierCommons(texte: string | null): string | null {
  if (!texte) return null;
  const t = texte.trim();
  const lisible = (brut: string) => decodeURIComponent(brut).replaceAll('_', ' ').trim();
  const fichier = /^(?:File|Fichier):(.+)$/.exec(t)?.[1];
  if (fichier) return lisible(fichier);
  const chemin = /Special:FilePath\/([^?#]+)/.exec(t)?.[1];
  if (chemin) return lisible(chemin);
  const upload =
    /upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/.exec(
      t,
    )?.[1];
  if (upload) return lisible(upload);
  const page = /commons\.wikimedia\.org\/wiki\/(?:File|Fichier):([^?#]+)/.exec(t)?.[1];
  return page ? lisible(page) : null;
}

/** Titre d'un article de Wikipédia en français, depuis l'adresse gardée en base (D092) ; null sinon. */
export function titreWikipediaFr(url: string | null): string | null {
  const titre = /^https:\/\/fr\.wikipedia\.org\/wiki\/(.+)$/.exec(url ?? '')?.[1];
  return titre ? decodeURIComponent(titre).replaceAll('_', ' ') : null;
}

export function licenceLibre(licence: string, regles: ReglesPhotos): boolean {
  const texte = texteComparable(licence);
  if (!texte) return false;
  const mots = new Set(texte.split(' '));
  if (regles.motifsLicencesRefusees.some((m) => mots.has(texteComparable(m)))) return false;
  return regles.licencesLibres.some((prefixe) => texte.startsWith(texteComparable(prefixe)));
}

export function auteurLisible(auteur: string | null, regles: ReglesPhotos): boolean {
  const texte = texteComparable(auteur ?? '');
  return texte !== '' && !regles.auteursVides.some((vide) => texteComparable(vide) === texte);
}

/** Extension en minuscules d'un nom de fichier ou d'une adresse (sans paramètres). */
function extension(nom: string): string {
  return /\.([a-z0-9]+)$/i.exec(nom.split(/[?#]/)[0] ?? '')?.[1]?.toLowerCase() ?? '';
}

/** Pas une photo (SVG, PDF…), ou nom qui contient un motif écarté (blason, carte, map, logo, locator). */
export function nomExclu(nom: string, regles: ReglesPhotos): boolean {
  if (!regles.extensionsImages.includes(extension(nom))) return true;
  const texte = texteComparable(nom);
  return regles.motifsFichiersExclus.some((m) => texte.includes(texteComparable(m)));
}

/** Carte postale ancienne, par une catégorie Commons ou par le nom du fichier (D101). */
export function estCartePostale(
  nom: string,
  categories: readonly string[],
  regles: ReglesPhotos,
): boolean {
  const textes = [nom, ...categories].map(texteComparable);
  return regles.motifsCartesPostales.some((m) =>
    textes.some((t) => t.includes(texteComparable(m))),
  );
}

/** Droits en cours ce jour-là (AAAA-MM-JJ, bornes comprises). Sans date : sans limite. */
export function droitsEnCours(debut: string | null, fin: string | null, jour: string): boolean {
  return (debut === null || debut <= jour) && (fin === null || fin >= jour);
}

/** Tourinsoft réduit l'image à la largeur demandée (`?width=800` : 3,4 Mo → 138 Ko, mesuré le 17/11). */
export function vignettesTourinsoft(
  url: string,
  regles: Pick<ReglesPhotos, 'largeurPetitePx' | 'largeurGrandePx'>,
): { petite: string; grande: string } {
  const avec = (largeur: number) => {
    const adresse = new URL(url);
    adresse.searchParams.set('width', String(largeur));
    return adresse.toString();
  };
  return { petite: avec(regles.largeurPetitePx), grande: avec(regles.largeurGrandePx) };
}

export interface ContexteChoix {
  metas: ReadonlyMap<string, MetaCommons>;
  regles: ReglesPhotos;
  exclues: ReadonlySet<string>;
  dateDuJour: string;
}

function examinerCommons(
  fichier: string,
  meta: MetaCommons | undefined,
  contexte: ContexteChoix,
): RaisonEcartPhoto | null {
  const { regles } = contexte;
  if (contexte.exclues.has(fichier)) return 'exclue_a_la_main';
  if (!meta) return 'introuvable';
  if (!regles.extensionsImages.includes(extension(fichier))) return 'format';
  if (!auteurLisible(meta.auteur, regles)) return 'sans_auteur';
  if (!licenceLibre(meta.licence, regles)) return 'licence';
  if (nomExclu(fichier, regles)) return 'nom_exclu';
  if (estCartePostale(fichier, meta.categories, regles)) return 'carte_postale';
  return null;
}

function examinerDatatourisme(
  media: MediaDatatourisme,
  contexte: ContexteChoix,
): RaisonEcartPhoto | null {
  const { regles } = contexte;
  if (contexte.exclues.has(media.url)) return 'exclue_a_la_main';
  if (!regles.extensionsImages.includes(extension(media.url))) return 'format';
  if (!auteurLisible(media.credits, regles)) return 'sans_auteur';
  const nom = decodeURIComponent(new URL(media.url).pathname.split('/').pop() ?? '');
  if (nomExclu(nom, regles)) return 'nom_exclu';
  if (estCartePostale(nom, [], regles)) return 'carte_postale';
  // Expirée au chargement : elle ne redeviendra pas valide. Les dates sont gardées pour l'affichage.
  if (media.fin !== null && media.fin < contexte.dateDuJour) return 'droits';
  return null;
}

/**
 * Une seule photo par lieu : la première valide dans l'ordre des candidats (OSM, Wikipédia, Wikidata,
 * DATAtourisme). Chaque candidat écarté est rendu avec sa raison, pour le rapport relu par Hardy.
 */
export function choisirPhoto(
  candidats: readonly Candidat[],
  contexte: ContexteChoix,
): { photo: PhotoChoisie | null; ecarts: { fichier: string; raison: RaisonEcartPhoto }[] } {
  const ecarts: { fichier: string; raison: RaisonEcartPhoto }[] = [];
  for (const candidat of candidats) {
    if (candidat.origine === 'datatourisme') {
      const { media } = candidat;
      const raison = examinerDatatourisme(media, contexte);
      if (raison) {
        ecarts.push({ fichier: media.url, raison });
        continue;
      }
      const { petite, grande } = vignettesTourinsoft(media.url, contexte.regles);
      return {
        photo: {
          origine: 'datatourisme',
          source: 'datatourisme_photos',
          fichier: media.url,
          urlPetite: petite,
          urlGrande: grande,
          auteur: (media.credits ?? '').trim(),
          licence: 'Licence Ouverte',
          licenceUrl: null,
          page: null,
          droitsDebut: media.debut,
          droitsFin: media.fin,
        },
        ecarts,
      };
    }
    const meta = contexte.metas.get(candidat.fichier);
    const raison = examinerCommons(candidat.fichier, meta, contexte);
    if (raison || !meta) {
      ecarts.push({ fichier: candidat.fichier, raison: raison ?? 'introuvable' });
      continue;
    }
    return {
      photo: {
        origine: candidat.origine,
        source: 'wikimedia_commons',
        fichier: candidat.fichier,
        urlPetite: meta.urlPetite,
        urlGrande: meta.urlGrande,
        auteur: meta.auteur.trim(),
        licence: meta.licence.trim(),
        licenceUrl: meta.licenceUrl,
        page: meta.page,
        droitsDebut: null,
        droitsFin: null,
      },
      ecarts,
    };
  }
  return { photo: null, ecarts };
}
