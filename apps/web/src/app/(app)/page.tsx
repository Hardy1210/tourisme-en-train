import { Suspense } from 'react';
import { EcranExplorer } from '@/features/explorer/ui/ecran-explorer';

// Suspense : l'écran lit l'URL (useSearchParams), connue seulement dans le navigateur.
export default function Accueil() {
  return (
    <Suspense>
      <EcranExplorer />
    </Suspense>
  );
}
