'use client';

import { SerwistProvider } from '@serwist/turbopack/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { parametres } from '@/config/parametres';
import { fautReessayer } from '@/lib/http/client';

export function Fournisseurs({ children }: { children: ReactNode }) {
  // Dans un état, et non au niveau du module : sinon le cache serait partagé entre les visiteurs côté serveur.
  const [clientRequetes] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: fautReessayer,
            staleTime: parametres.cache.donneesStablesS * 1000,
            // Hors ligne, la requête part quand même : le service worker répond avec sa copie (D071).
            networkMode: 'offlineFirst',
          },
        },
      }),
  );
  return (
    // En production seulement : en développement, il garderait d'anciens fichiers. `cacheOnNavigation` :
    // une fiche ouverte sans recharger la page reste disponible hors ligne (aucune position, D058).
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV !== 'production'}
      cacheOnNavigation
      reloadOnOnline={false}
    >
      <QueryClientProvider client={clientRequetes}>{children}</QueryClientProvider>
    </SerwistProvider>
  );
}
