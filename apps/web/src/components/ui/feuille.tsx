'use client';

import { type ReactNode, useRef } from 'react';
import { Drawer } from 'vaul';
import { cn } from '@/lib/classes';
import { useHauteurClavier } from '@/lib/use-hauteur-clavier';
import { BoutonFermer } from './bouton';
import { IndicateurDefilement } from './indicateur-defilement';

type Proprietes = {
  ouverte: boolean;
  surChangement: (ouverte: boolean) => void;
  titre: string;
  /** Sur grand écran : petit panneau flottant à côté du rail de navigation, sans voile. */
  ancreeAuRail?: boolean;
  /**
   * Une fois la feuille sortie de l'écran. Un travail lourd lancé pendant la glissade (filtrer la liste
   * et la carte) bloque le téléphone : la feuille disparaîtrait d'un coup au lieu de glisser.
   */
  apresFermeture?: () => void;
  /**
   * Hauteur fixe (`--feuille-trajet-haut`) : le clavier passe par-dessus le bas de la feuille, qui ne
   * bouge pas ; seule la zone qui défile s'arrête au-dessus du clavier.
   */
  hauteurFixe?: boolean;
  children: ReactNode;
};

/** Panneau glissant par le bas : se ferme au doigt, à la touche Échap, par le bouton ou d'un clic à côté. */
export function Feuille({
  ouverte,
  surChangement,
  titre,
  ancreeAuRail = false,
  apresFermeture,
  hauteurFixe = false,
  children,
}: Proprietes) {
  const zone = useRef<HTMLDivElement>(null);
  const contenu = useRef<HTMLDivElement>(null);
  const clavier = useHauteurClavier(hauteurFixe && ouverte);
  return (
    // Par défaut, vaul remonte la feuille au-dessus du clavier : la feuille à hauteur fixe reste en place.
    <Drawer.Root open={ouverte} onOpenChange={surChangement} repositionInputs={!hauteurFixe}>
      <Drawer.Portal>
        <Drawer.Overlay
          className={cn(
            'fixed inset-x-0 top-0 z-overlay h-(--hauteur-app) bg-overlay',
            ancreeAuRail && 'lg:bg-transparent',
          )}
        />
        <Drawer.Content
          aria-describedby={undefined}
          // Fin de la glissade de sortie (aussi quand le téléphone réduit les animations).
          onAnimationEnd={(evenement) => {
            if (evenement.target === evenement.currentTarget && !ouverte) apresFermeture?.();
          }}
          className={cn(
            'fixed inset-x-0 bottom-(--decalage-bas) z-overlay flex max-h-(--feuille-hauteur-max) flex-col gap-4 rounded-t-feuille bg-feuille-bg px-5 pt-2.5 shadow-sheet outline-none safe-bottom',
            hauteurFixe &&
              'max-h-none h-[calc(var(--hauteur-app)-env(safe-area-inset-top,0px)-var(--feuille-trajet-haut))]',
            ancreeAuRail &&
              'lg:right-auto lg:bottom-4 lg:left-[calc(var(--rail-largeur)+0.5rem)] lg:w-80 lg:rounded-lg lg:border lg:px-3 lg:pt-1.5 lg:shadow-float lg:after:hidden',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-1.25 w-10 flex-none self-center rounded-pill bg-feuille-poignee',
              ancreeAuRail && 'lg:hidden',
            )}
          />
          <div
            className={cn('flex items-center justify-between gap-3', ancreeAuRail && 'lg:contents')}
          >
            <Drawer.Title
              className={cn('font-display text-xl font-bold', ancreeAuRail && 'lg:sr-only')}
            >
              {titre}
            </Drawer.Title>
            {/* Sur grand écran, le panneau flottant se ferme d'un clic à côté ou par Échap. */}
            <Drawer.Close asChild>
              <BoutonFermer className={cn('-mr-2.5', ancreeAuRail && 'lg:hidden')} />
            </Drawer.Close>
          </div>
          {/* Barre du navigateur masquée : l'indicateur la remplace, visible même sans geste. */}
          {/* Clavier ouvert : les derniers résultats restent atteignables au-dessus de lui. */}
          <div
            className="relative flex min-h-0 flex-1 flex-col"
            style={clavier > 0 ? { marginBottom: clavier } : undefined}
          >
            <div
              ref={zone}
              className={cn(
                'min-h-0 flex-1 overflow-y-auto pb-6 scrollbar-none',
                ancreeAuRail && 'lg:pb-1.5',
              )}
            >
              <div ref={contenu}>{children}</div>
            </div>
            <IndicateurDefilement zone={zone} contenu={contenu} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
