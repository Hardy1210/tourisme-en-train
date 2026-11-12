'use client';

// Page plein écran du téléphone (D085). Toujours présente, mais cachée (`inert`, transparente) tant
// qu'elle est fermée : un champ peut ainsi prendre la main DANS le toucher qui l'ouvre, seule façon
// d'ouvrir le clavier sur iPhone (`ouvrirPage`). Fondu à l'ouverture et à la fermeture ; rien ne glisse
// et rien ne suit le clavier : le fond couvre toujours tout l'écran, seul le contenu s'arrête au-dessus
// du clavier (`placementPage`).
import { ArrowLeft } from 'lucide-react';
import { type ReactNode, type RefObject, useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { bloquerGeste, positionListe } from '@/lib/blocage-geste';
import { cn } from '@/lib/classes';
import { useZoneVisible } from '@/lib/use-zone-visible';
import { placementPage } from './placement-page';

type Proprietes = {
  ouverte: boolean;
  /** Le conteneur, pour `ouvrirPage` dans le toucher. */
  page: RefObject<HTMLDivElement | null>;
  /** Nom de la page pour les lecteurs d'écran. */
  titre: string;
  libelleRetour: string;
  surRetour: () => void;
  /** Une fois le fondu de fermeture terminé : le travail lourd (filtrer liste et carte) vient ici. */
  apresFermeture?: () => void;
  children: ReactNode;
};

const sansAbonnement = () => () => {};

/** Zone qui défile dans la page : le seul endroit où le doigt peut faire défiler quelque chose. */
export const ATTRIBUT_DEFILEMENT = 'data-defilement';

/** À appeler dans le gestionnaire du toucher, avant tout changement d'état : le clavier s'ouvre. */
export function ouvrirPage(page: HTMLElement | null, champ: HTMLElement | null): void {
  if (page) page.inert = false;
  champ?.focus({ preventScroll: true });
}

export function PagePleinEcran({
  ouverte,
  page,
  titre,
  libelleRetour,
  surRetour,
  apresFermeture,
  children,
}: Proprietes) {
  const monte = useSyncExternalStore(
    sansAbonnement,
    () => true,
    () => false,
  );
  const placement = placementPage(useZoneVisible(ouverte));
  // Fermeture en cours : `apresFermeture` une seule fois, à la fin du fondu (ou sans animation).
  const enFermeture = useRef(false);
  const terminer = () => {
    if (!enFermeture.current) return;
    enFermeture.current = false;
    apresFermeture?.();
  };
  const terminerRef = useRef(terminer);
  useEffect(() => {
    terminerRef.current = terminer;
  });
  useEffect(() => {
    if (ouverte) {
      enFermeture.current = true;
      return;
    }
    // Filet si le fondu ne se termine pas (animations coupées par le téléphone).
    const filet = window.setTimeout(() => terminerRef.current(), 400);
    return () => window.clearTimeout(filet);
  }, [ouverte]);

  // Ouverte : la page reste fixe. Un geste qui n'a rien à faire défiler ne passe pas à la page derrière
  // (iPhone), et le fond ne défile plus ni ne rebondit.
  useEffect(() => {
    const element = page.current;
    if (!ouverte || !element) return;
    let dernierY = 0;
    const debut = (evenement: TouchEvent) => {
      dernierY = evenement.touches[0]?.clientY ?? 0;
    };
    const deplacement = (evenement: TouchEvent) => {
      const y = evenement.touches[0]?.clientY ?? dernierY;
      const deplacementY = y - dernierY;
      dernierY = y;
      const cible = evenement.target instanceof Element ? evenement.target : null;
      const liste = cible?.closest<HTMLElement>(`[${ATTRIBUT_DEFILEMENT}]`) ?? null;
      const position = liste
        ? positionListe({
            defilement: liste.scrollTop,
            hauteurVisible: liste.clientHeight,
            hauteurContenu: liste.scrollHeight,
          })
        : { defilable: false, enHaut: true, enBas: true };
      if (bloquerGeste({ dansListe: liste !== null, ...position, deplacementY }))
        evenement.preventDefault();
    };
    // Sans `passive: false`, Safari ignore `preventDefault`.
    element.addEventListener('touchstart', debut, { passive: true });
    element.addEventListener('touchmove', deplacement, { passive: false });
    const racine = document.documentElement.style;
    const avant = { overflow: racine.overflow, rebond: racine.overscrollBehavior };
    racine.overflow = 'hidden';
    racine.overscrollBehavior = 'none';
    return () => {
      element.removeEventListener('touchstart', debut);
      element.removeEventListener('touchmove', deplacement);
      racine.overflow = avant.overflow;
      racine.overscrollBehavior = avant.rebond;
    };
  }, [ouverte, page]);

  if (!monte) return null;
  return createPortal(
    <div
      ref={page}
      role="dialog"
      aria-modal="true"
      aria-label={titre}
      inert={!ouverte}
      onTransitionEnd={(evenement) => {
        if (evenement.target === evenement.currentTarget && !ouverte) terminer();
      }}
      className={cn(
        'fixed inset-x-0 top-0 z-overlay h-(--hauteur-app) bg-background transition-opacity lg:hidden',
        ouverte ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      style={placement.fond}
    >
      <div className="flex h-full flex-col safe-top" style={placement.contenu}>
        <div className="flex-none px-4">
          <button
            type="button"
            onClick={surRetour}
            className="-ml-1 flex h-touch cursor-pointer items-center gap-2 rounded-bouton px-1 text-base font-semibold text-primary"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
            {libelleRetour}
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
