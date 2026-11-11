'use client';

import { type ReactNode, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { Drawer } from 'vaul';
import { passerLaMain, retirerAmorce } from '@/lib/amorce-clavier';
import { cn } from '@/lib/classes';
import { estGrandEcran } from '@/lib/ecran';
import { Bouton, BoutonFermer } from './bouton';
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
   * Sur téléphone : page plein écran qui monte du bas, flèche vers le bas pour la refermer, champ prêt
   * à taper dès l'ouverture (avec `amorcerClavier` dans le toucher). Sur grand écran : feuille normale.
   */
  pleinEcran?: boolean;
  children: ReactNode;
};

/** Panneau glissant par le bas : se ferme au doigt, à la touche Échap, par le bouton ou d'un clic à côté. */
export function Feuille({
  ouverte,
  surChangement,
  titre,
  ancreeAuRail = false,
  apresFermeture,
  pleinEcran = false,
  children,
}: Proprietes) {
  const zone = useRef<HTMLDivElement>(null);
  const contenu = useRef<HTMLDivElement>(null);
  return (
    <Drawer.Root open={ouverte} onOpenChange={surChangement}>
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
          // Page plein écran sur téléphone : le premier champ prend la main du champ d'amorce.
          onOpenAutoFocus={(evenement) => {
            if (!pleinEcran || estGrandEcran()) return retirerAmorce();
            evenement.preventDefault();
            passerLaMain(contenu.current?.querySelector('input'));
          }}
          onCloseAutoFocus={retirerAmorce}
          onAnimationEnd={(evenement) => {
            if (evenement.target === evenement.currentTarget && !ouverte) apresFermeture?.();
          }}
          className={cn(
            'fixed inset-x-0 bottom-(--decalage-bas) z-overlay flex max-h-(--feuille-hauteur-max) flex-col gap-4 rounded-t-feuille bg-feuille-bg px-5 pt-2.5 shadow-sheet outline-none safe-bottom',
            pleinEcran &&
              'top-0 max-h-none rounded-none pt-[max(env(safe-area-inset-top),var(--espace-bord))] lg:top-auto lg:max-h-(--feuille-hauteur-max) lg:rounded-t-feuille lg:pt-2.5',
            ancreeAuRail &&
              'lg:right-auto lg:bottom-4 lg:left-[calc(var(--rail-largeur)+0.5rem)] lg:w-80 lg:rounded-lg lg:border lg:px-3 lg:pt-1.5 lg:shadow-float lg:after:hidden',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-1.25 w-10 flex-none self-center rounded-pill bg-feuille-poignee',
              ancreeAuRail && 'lg:hidden',
              pleinEcran && 'max-lg:hidden',
            )}
          />
          <div
            className={cn('flex items-center justify-between gap-3', ancreeAuRail && 'lg:contents')}
          >
            {/* Page plein écran : elle est venue du bas, la flèche vers le bas l'y renvoie. */}
            {pleinEcran && (
              <Drawer.Close asChild>
                <Bouton
                  variante="fantome"
                  forme="icone"
                  aria-label="Fermer"
                  className="-ml-2.5 text-foreground lg:hidden"
                >
                  <ChevronDown aria-hidden="true" className="size-6" />
                </Bouton>
              </Drawer.Close>
            )}
            <Drawer.Title
              className={cn(
                'font-display text-xl font-bold',
                ancreeAuRail && 'lg:sr-only',
                pleinEcran && 'max-lg:flex-1',
              )}
            >
              {titre}
            </Drawer.Title>
            {/* Sur grand écran, le panneau flottant se ferme d'un clic à côté ou par Échap. */}
            <Drawer.Close asChild>
              <BoutonFermer
                className={cn(
                  '-mr-2.5',
                  ancreeAuRail && 'lg:hidden',
                  pleinEcran && 'max-lg:hidden',
                )}
              />
            </Drawer.Close>
          </div>
          {/* Barre du navigateur masquée : l'indicateur la remplace, visible même sans geste. */}
          <div className="relative flex min-h-0 flex-1 flex-col">
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
