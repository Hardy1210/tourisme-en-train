'use client';

import dynamic from 'next/dynamic';

// MapLibre ne fonctionne que dans le navigateur, et pèse lourd : chargé à part, après la page.
export const CarteLieuxDifferee = dynamic(() => import('./carte-lieux').then((m) => m.CarteLieux), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="h-full bg-map-land" />,
});
