'use client';

import dynamic from 'next/dynamic';

// MapLibre ne fonctionne que dans le navigateur, et pèse lourd : chargé à part, après la page.
export const CarteExplorerDifferee = dynamic(
  () => import('./carte-explorer').then((m) => m.CarteExplorer),
  {
    ssr: false,
    loading: () => (
      <div aria-hidden="true" className="h-(--carte-geo-hauteur) rounded-carte bg-map-land" />
    ),
  },
);
