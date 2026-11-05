import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { marque } from '@/config/marque';
import '@/styles/globals.css';
import { Fournisseurs } from './fournisseurs';
import { COULEUR_THEME } from './manifest';
import { classesPolices } from './polices';

// Pas d'URL_APP ici : une page statique est calculée à la construction, l'URL serait figée dans l'image (D031).
export const metadata: Metadata = {
  title: { default: marque.nom, template: `%s · ${marque.nom}` },
  description: marque.description,
  // iPhone : Safari ne lit pas les icônes du manifest (D071).
  icons: { apple: '/icones/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: marque.nom, statusBarStyle: 'default' },
};

export const viewport: Viewport = { themeColor: COULEUR_THEME };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={classesPolices}>
      <body>
        <Fournisseurs>{children}</Fournisseurs>
      </body>
    </html>
  );
}
