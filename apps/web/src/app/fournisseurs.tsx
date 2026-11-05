'use client';

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
          queries: { retry: fautReessayer, staleTime: parametres.cache.donneesStablesS * 1000 },
        },
      }),
  );
  return <QueryClientProvider client={clientRequetes}>{children}</QueryClientProvider>;
}
