'use client';

// Lien repliable « Comment autoriser la localisation ? » (D083) : ouvert tout seul quand une nouvelle
// demande a encore été refusée. Textes : `contenu-guidage.ts` ; choix de l'appareil : `appareil.ts`.
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Bandeau } from '@/components/ui/bandeau';
import { cn } from '@/lib/classes';

import { GUIDES_LOCALISATION, LIBELLES_GUIDAGE } from '../contenu-guidage';
import { useAppareil } from './use-appareil';

type Proprietes = {
  bloquee: boolean;
  /** Sur le fond de la marque (écran 2 de l'accueil, D113). */
  surMarque?: boolean;
};

export function GuidageLocalisation({ bloquee, surMarque = false }: Proprietes) {
  const appareil = useAppareil();
  // null : la personne n'a pas encore touché le lien ; ouvert si la localisation reste bloquée.
  const [choix, setChoix] = useState<boolean | null>(null);
  const ouvert = choix ?? bloquee;
  const guide = GUIDES_LOCALISATION[appareil];

  return (
    <div className="flex flex-col gap-3">
      {bloquee && <Bandeau variante="info">{LIBELLES_GUIDAGE.toujoursBloquee}</Bandeau>}
      <details
        open={ouvert}
        onToggle={(evenement) => setChoix(evenement.currentTarget.open)}
        className={cn(
          'group rounded-carte px-4 py-3',
          surMarque ? 'bg-carte-sur-marque-bg' : 'bg-surface-sunken',
        )}
      >
        <summary
          className={cn(
            'flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden',
            surMarque ? 'text-carte-sur-marque-texte' : 'text-primary',
          )}
        >
          {LIBELLES_GUIDAGE.lien}
          <ChevronDown
            aria-hidden="true"
            className="size-4.5 transition-transform group-open:rotate-180"
          />
        </summary>
        <div
          className={cn(
            'mt-3 flex flex-col gap-2 text-sm',
            surMarque ? 'text-carte-sur-marque-texte' : 'text-foreground',
          )}
        >
          <p className="font-semibold">{guide.titre}</p>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5">
            {guide.etapes.map((etape) => (
              <li key={etape}>{etape}</li>
            ))}
          </ol>
          {guide.complement && (
            <p
              className={surMarque ? 'text-carte-sur-marque-texte-muted' : 'text-muted-foreground'}
            >
              {guide.complement}
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
