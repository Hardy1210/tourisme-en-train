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
  // Écran 3a : la gare de départ, et une destination facultative.
  titreGare: 'Votre gare de départ',
  presentation: {
    plus_proche: 'La plus proche de vous. Vous pouvez en choisir une autre.',
    // D064 : une gare mieux desservie un peu plus loin ; jamais « la plus proche » dans ce cas.
    mieux_desservie: 'La mieux desservie près de vous. Vous pouvez en choisir une autre.',
    choisie: 'Vous pouvez en choisir une autre.',
  },
  rechercheGare: 'On cherche votre gare…',
  changer: 'Changer',
  changerGare: (gare: string) => `Changer de gare de départ (${gare})`,
  dejaUneIdee: 'Vous savez déjà où aller ?',
  facultatif: '(facultatif)',
  destination: 'Destination',
  voirSorties: 'Voir les sorties',
} as const;
