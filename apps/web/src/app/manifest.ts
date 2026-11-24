import type { MetadataRoute } from 'next';
import { marque } from '@/config/marque';

// Couleur de --primary (globals.css), copiée car un manifest ne lit pas le CSS : un test vérifie qu'elle
// reste identique. C'est aussi le fond de l'écran de démarrage d'Android, celui de notre écran de
// lancement (D112) : les deux s'enchaînent sans saut. Icônes provisoires, dans public/icones/ (D071).
export const COULEUR_THEME = '#623362';

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
    background_color: COULEUR_THEME,
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
