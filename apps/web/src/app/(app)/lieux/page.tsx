import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EcranLieux } from '@/features/explorer/ui/ecran-lieux';

export const metadata: Metadata = { title: 'Lieux' };

// Suspense : l'écran lit l'URL (useSearchParams), connue seulement dans le navigateur.
export default function PageLieux() {
  return (
    <Suspense>
      <EcranLieux />
    </Suspense>
  );
}
