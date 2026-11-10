'use client';

// Lien repliable « Comment autoriser la localisation ? » (D083) : ouvert tout seul quand une nouvelle
// demande a encore été refusée. Textes : `contenu-guidage.ts` ; choix de l'appareil : `appareil.ts`.
import { ChevronDown } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';

import { Bandeau } from '@/components/ui/bandeau';

import { reconnaitreAppareil } from '../appareil';
import { type Appareil, GUIDES_LOCALISATION, LIBELLES_GUIDAGE } from '../contenu-guidage';

const sansAbonnement = () => () => {};

/** Lu dans le navigateur seulement ; « inconnu » au rendu serveur (texte générique). */
function lireAppareil(): Appareil {
  const installee =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return reconnaitreAppareil({
    userAgent: navigator.userAgent,
    installee,
    tactile: navigator.maxTouchPoints > 1,
  });
}

export function GuidageLocalisation({ bloquee }: { bloquee: boolean }) {
  const appareil = useSyncExternalStore(sansAbonnement, lireAppareil, () => 'inconnu' as const);
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
        className="group rounded-carte bg-surface-sunken px-4 py-3"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden">
          {LIBELLES_GUIDAGE.lien}
          <ChevronDown
            aria-hidden="true"
            className="size-4.5 transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="mt-3 flex flex-col gap-2 text-sm text-foreground">
          <p className="font-semibold">{guide.titre}</p>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5">
            {guide.etapes.map((etape) => (
              <li key={etape}>{etape}</li>
            ))}
          </ol>
          {guide.complement && <p className="text-muted-foreground">{guide.complement}</p>}
        </div>
      </details>
    </div>
  );
}
