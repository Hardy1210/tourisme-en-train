// Photos de l'écran de bienvenue (D113) : une au hasard à chaque ouverture. Fichiers dans
// public/accueil/ (WebP, 1200 px de large) ; crédit affiché par le ⓘ, source citée dans « Sources »
// (Wikimedia Commons, DATAtourisme : règle 8). Originaux et crédits : design/maquettes/photos-accueil/.
// Ajouter une photo = son fichier + une entrée ici.
import type { Photo } from '@/features/lieux/schemas';

export type PhotoAccueil = {
  photo: Photo;
  /** `object-position` : la partie de la photo gardée sous la courbe de l'en-tête. */
  cadrage: string;
};

export const PHOTOS_ACCUEIL: readonly PhotoAccueil[] = [
  {
    photo: {
      petite: '/accueil/hotel-dieu-beaune.webp',
      grande: '/accueil/hotel-dieu-beaune.webp',
      auteur: 'Stefan Bauer, http://www.ferras.at',
      licence: 'CC BY-SA 2.5',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.5',
      page: 'https://commons.wikimedia.org/wiki/File:Hostel_Dieu_Beaune.jpg',
      source: 'wikimedia_commons',
    },
    cadrage: '30% 40%',
  },
];
