// Photo d'un lieu à l'écran (D100, D101, D103) : lecture depuis la base, texte du crédit, et passage de
// l'icône de la catégorie à la photo. Fonctions pures, partagées par le serveur et l'interface.
import type { Photo } from './schemas';

/** Colonnes de la jointure `photo_lieu` (server/requetes-photo.ts) : toutes nulles sans photo valable. */
export interface ColonnesPhoto {
  photo_petite: string | null;
  photo_grande: string | null;
  photo_auteur: string | null;
  photo_licence: string | null;
  photo_licence_url: string | null;
  photo_page: string | null;
  photo_source: string | null;
}

export function photoDe(ligne: ColonnesPhoto): Photo | null {
  const { photo_petite, photo_grande, photo_auteur, photo_licence, photo_source } = ligne;
  if (!photo_petite || !photo_grande || !photo_auteur || !photo_licence) return null;
  if (photo_source !== 'wikimedia_commons' && photo_source !== 'datatourisme_photos') return null;
  return {
    petite: photo_petite,
    grande: photo_grande,
    auteur: photo_auteur,
    licence: photo_licence,
    licenceUrl: ligne.photo_licence_url,
    page: ligne.photo_page,
    source: photo_source,
  };
}

/** Nom affiché de la source d'une photo. */
export const NOMS_SOURCES_PHOTO: Readonly<Record<Photo['source'], string>> = {
  wikimedia_commons: 'Wikimedia Commons',
  datatourisme_photos: 'DATAtourisme',
};

/** « Photo : auteur · licence · source » (D101). */
export function texteCredit(photo: Photo): string {
  return `Photo : ${photo.auteur} · ${photo.licence} · ${NOMS_SOURCES_PHOTO[photo.source]}`;
}

/**
 * attente : l'icône seule, la photo pas encore à l'écran ; chargement : à l'écran, la limite de temps court ;
 * affichee : la photo par-dessus l'icône ; abandon : trop lente ou en erreur, l'icône reste (D103).
 */
export type EtatPhoto = 'attente' | 'chargement' | 'affichee' | 'abandon';
export type EvenementPhoto = 'visible' | 'chargee' | 'erreur' | 'delai';

export function etatSuivant(etat: EtatPhoto, evenement: EvenementPhoto): EtatPhoto {
  if (etat === 'affichee' || etat === 'abandon') return etat;
  switch (evenement) {
    case 'visible':
      return etat === 'attente' ? 'chargement' : etat;
    case 'chargee':
      return 'affichee';
    case 'erreur':
      return 'abandon';
    case 'delai':
      return etat === 'chargement' ? 'abandon' : etat;
  }
}
