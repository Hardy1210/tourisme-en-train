// Photos de l'écran de bienvenue (D113) : une au hasard à chaque ouverture. Fichiers dans
// public/accueil/ (WebP, 1200 px de large) ; crédit affiché par le ⓘ, source citée dans « Sources »
// (Wikimedia Commons, DATAtourisme : règle 8). Originaux et candidats : design/maquettes/photos-accueil/,
// sur le poste (hors dépôt).
// Ajouter une photo = son fichier + une entrée ici.
import type { Photo } from '@/features/lieux/schemas';

export type PhotoAccueil = {
  photo: Photo;
  /** `object-position` : la partie de la photo gardée sous la courbe de l'en-tête. */
  cadrage: string;
};

// Toutes à pied d'une gare desservie (distances de la base, `lieu_gare`, vérifiées le 24/11).
export const PHOTOS_ACCUEIL: readonly PhotoAccueil[] = [
  // Hôtel-Dieu – Hospices de Beaune : gare de Beaune, ≈ 16 min à pied
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
  // Basilique Notre-Dame, La Charité-sur-Loire : gare, ≈ 10 min à pied
  {
    photo: {
      petite: '/accueil/basilique-la-charite-sur-loire.webp',
      grande: '/accueil/basilique-la-charite-sur-loire.webp',
      auteur: 'Yann Gwilhoù',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      page: 'https://commons.wikimedia.org/wiki/File:Abside_prieure_La_Charite_sur_Loire.jpg',
      source: 'wikimedia_commons',
    },
    cadrage: '50% 30%',
  },
  // Château des ducs de Wurtemberg, Montbéliard : gare, ≈ 3 min à pied
  {
    photo: {
      petite: '/accueil/chateau-montbeliard.webp',
      grande: '/accueil/chateau-montbeliard.webp',
      auteur: 'Norbert Aepli (User:Noebu)',
      licence: 'Domaine public',
      licenceUrl: null,
      page: 'https://commons.wikimedia.org/wiki/File:2009-05-03_Montbeliard_108.JPG',
      source: 'wikimedia_commons',
    },
    cadrage: '55% 30%',
  },
  // Lac de Remoray : gare de Labergement-Sainte-Marie, ≈ 23 min à pied
  {
    photo: {
      petite: '/accueil/lac-de-remoray.webp',
      grande: '/accueil/lac-de-remoray.webp',
      auteur: 'JGS25',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      page: 'https://commons.wikimedia.org/wiki/File:Labergement-Sainte-Marie,_lac_de_Remoray.jpg',
      source: 'wikimedia_commons',
    },
    cadrage: '50% 50%',
  },
  // Canal de Bourgogne, Migennes : gare de Laroche-Migennes, ≈ 10 min à pied
  {
    photo: {
      petite: '/accueil/canal-de-bourgogne-migennes.webp',
      grande: '/accueil/canal-de-bourgogne-migennes.webp',
      auteur: 'Daytona Goguelat',
      licence: 'Licence Ouverte',
      licenceUrl: null,
      page: null,
      source: 'datatourisme_photos',
    },
    cadrage: '50% 50%',
  },
  // Belvédère de l'Hermitage, Saint-Claude : gare, ≈ 13 min à pied
  {
    photo: {
      petite: '/accueil/belvedere-hermitage-saint-claude.webp',
      grande: '/accueil/belvedere-hermitage-saint-claude.webp',
      auteur: '© Marianne Levert',
      licence: 'Licence Ouverte',
      licenceUrl: null,
      page: null,
      source: 'datatourisme_photos',
    },
    cadrage: '50% 40%',
  },
];
