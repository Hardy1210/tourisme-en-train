'use client';

import { ArrowLeft } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';
import { useRetour } from '@/lib/utiliser-retour';

export function RetourPage() {
  const surRetour = useRetour();
  return (
    <Bouton variante="fantome" className="-ml-2 px-2 font-semibold" onClick={surRetour}>
      <ArrowLeft aria-hidden="true" className="size-5" />
      Retour
    </Bouton>
  );
}
