import type { ReactNode } from 'react';
import { NavBasse } from './nav-basse';

export default function MiseEnPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col lg:flex-row">
      {/* La navigation d'abord : le rail est à gauche sur grand écran, où l'on navigue au clavier. */}
      <NavBasse />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
