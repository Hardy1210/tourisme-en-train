import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { marque } from '@/config/marque';
import '@/styles/globals.css';

// Pas d'URL_APP ici : une page statique est calculée à la construction, l'URL serait figée dans l'image (D031).
// Elle sera lue à l'exécution avec le manifest (E14).
export const metadata: Metadata = {
  title: { default: marque.nom, template: `%s · ${marque.nom}` },
  description: marque.description,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
