'use client';

import type { LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Bouton } from '@/components/ui/bouton';
import { cn } from '@/lib/classes';

const LONGUEUR_RESUME = 240;

export function Info({
  Icone,
  titre,
  children,
}: {
  Icone: LucideIcon;
  titre: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 border-b px-3.5 py-3 last:border-b-0">
      <Icone aria-hidden="true" className="mt-0.5 size-5 flex-none text-primary" />
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-semibold text-muted-foreground">{titre}</span>
        <span className="text-md text-pretty">{children}</span>
      </div>
    </div>
  );
}

export function Description({ texte }: { texte: string }) {
  const [ouverte, setOuverte] = useState(false);
  const longue = texte.length > LONGUEUR_RESUME;
  return (
    <div className="flex flex-col items-start">
      <p className={cn('text-pretty', longue && !ouverte && 'line-clamp-4')}>{texte}</p>
      {longue && (
        <Bouton
          variante="fantome"
          aria-expanded={ouverte}
          className="-ml-2 px-2 font-semibold text-primary"
          onClick={() => setOuverte(!ouverte)}
        >
          {ouverte ? 'Réduire' : 'Lire la suite'}
        </Bouton>
      )}
    </div>
  );
}
