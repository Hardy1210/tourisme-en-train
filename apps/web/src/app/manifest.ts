import type { MetadataRoute } from 'next';
import { marque } from '@/config/marque';

// Couleurs de --primary et --background (globals.css), copiées car un manifest ne lit pas le CSS :
// un test vérifie qu'elles restent identiques. Icônes provisoires, remplaçables dans public/icones/ (D071).
export const COULEUR_THEME = '#623362';
export const COULEUR_FOND = '#fbf7fb';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: marque.nom,
    short_name: marque.nom,
    description: marque.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    lang: 'fr',
    theme_color: COULEUR_THEME,
    background_color: COULEUR_FOND,
    icons: [
      { src: '/icones/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icones/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icones/icone-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
