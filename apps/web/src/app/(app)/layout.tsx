import type { ReactNode } from 'react';
import { BandeauHorsLigne } from '@/components/ui/bandeau-hors-ligne';
import { SecoursChargement } from '@/components/ui/secours-chargement';
import { ExplorerPersistant } from '@/features/explorer/ui/explorer-persistant';
import { FournisseurPosition } from '@/features/localisation/fournisseur-position';
import { NavBasse } from './nav-basse';

export default function MiseEnPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-(--hauteur-app) flex-col overflow-hidden lg:flex-row">
      {/* La navigation d'abord : le rail est à gauche sur grand écran, où l'on navigue au clavier. */}
      <NavBasse />
      <FournisseurPosition>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <BandeauHorsLigne />
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <SecoursChargement />
            <ExplorerPersistant />
            {children}
          </main>
        </div>
      </FournisseurPosition>
    </div>
  );
}
