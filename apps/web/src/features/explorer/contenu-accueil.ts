// Textes de l'écran de bienvenue (D113, maquette « Accueil », écran 1). Le nom de la marque vient de
// config/marque.ts (règle 2).
import { marque } from '@/config/marque';

export const TEXTES_ACCUEIL = {
  titre: 'Que faire autour de vous ?',
  texte: 'Partagez votre position : on vous montre aussitôt les sorties et les trains autour.',
  utiliserPosition: 'Utiliser ma position',
  ou: 'ou',
  champ: 'Nom de ville ou de gare',
  suggestions: 'Gares suggérées',
  confidentialite: `Votre position n'est jamais enregistrée par ${marque.nom}.`,
} as const;
