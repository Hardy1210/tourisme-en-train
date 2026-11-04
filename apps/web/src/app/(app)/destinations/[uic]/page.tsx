import { Suspense } from 'react';
import { EcranDestination } from '@/features/destinations/ui/ecran-destination';

// Suspense : l'écran lit l'URL (useSearchParams), connue seulement dans le navigateur.
export default async function PageDestination({ params }: { params: Promise<{ uic: string }> }) {
  const { uic } = await params;
  return (
    <Suspense>
      <EcranDestination uic={uic} />
    </Suspense>
  );
}
