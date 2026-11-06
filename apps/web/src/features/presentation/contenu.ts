// Textes de l'écran « Sources » : un seul fichier, aucun texte dispersé dans le JSX (fiche E13).
import type { GroupeSource } from '@tourisme/commun';
import { marque } from '@/config/marque';

export const TEXTES_SOURCES = {
  titre: 'Sources des données',
  introduction: `${marque.nom} est construit avec des données publiques. Merci à leurs producteurs.`,
  lien: 'Voir la source',
  /** Date du dernier chargement, relevé ou calibrage : pas forcément celle du producteur. */
  releve: 'Relevé le',
  fondDeCarte: 'Fond de carte :',
  defi: 'Projet réalisé dans le cadre du défi data.gouv.fr « Tourisme en train » (Fondation SNCF / Open Data University).',
  position: `${marque.nom} n'enregistre jamais votre position.`,
  erreurTitre: 'Les sources ne sont pas disponibles',
  erreurTexte: 'Réessayez dans un instant.',
  reessayer: 'Réessayer',
} as const;

export const LIBELLES_GROUPES: Record<GroupeSource, string> = {
  trains: 'Trains',
  lieux: 'Lieux',
  transports: 'Transports en ville',
  carte_calculs: 'Carte et calculs',
};
