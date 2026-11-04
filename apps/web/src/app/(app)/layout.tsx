import type { ReactNode } from 'react';
import { NavBasse } from './nav-basse';

export default function MiseEnPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col">
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      <NavBasse />
    </div>
  );
}
