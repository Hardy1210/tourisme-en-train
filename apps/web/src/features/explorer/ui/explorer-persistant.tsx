'use client';

import { usePathname } from 'next/navigation';
import { Suspense, useState } from 'react';
import { FournisseurEcranVisible } from '@/lib/ecran-visible';
import { EcranExplorer } from './ecran-explorer';

/**
 * Explorer reste en vie une fois ouvert, caché sur les autres écrans : au retour, la carte, ses tuiles
 * et ses épingles sont déjà là (D069). Rien n'est créé tant qu'on n'y est pas allé.
 */
export function ExplorerPersistant() {
  const visible = usePathname() === '/';
  const [dejaOuvert, setDejaOuvert] = useState(visible);
  if (visible && !dejaOuvert) setDejaOuvert(true);
  if (!dejaOuvert) return null;

  return (
    <FournisseurEcranVisible value={visible}>
      <div className={visible ? 'h-full' : 'hidden'}>
        {/* Suspense : l'écran lit l'URL (useSearchParams), connue seulement dans le navigateur. */}
        <Suspense>
          <EcranExplorer />
        </Suspense>
      </div>
    </FournisseurEcranVisible>
  );
}
