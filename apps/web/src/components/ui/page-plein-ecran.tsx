'use client';

// Page plein écran du téléphone (D085). Toujours présente, mais cachée (`inert`, transparente) tant
// qu'elle est fermée : un champ peut ainsi prendre la main DANS le toucher qui l'ouvre, seule façon
// d'ouvrir le clavier sur iPhone (`ouvrirPage`). Fondu à l'ouverture et à la fermeture ; rien ne glisse
// et rien ne suit le clavier : seule sa hauteur s'arrête au-dessus de lui.
import { ArrowLeft } from 'lucide-react';
import { type ReactNode, type RefObject, useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/classes';
import { useZoneVisible } from '@/lib/use-zone-visible';

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
  const zone = useZoneVisible(ouverte);
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
        'fixed inset-x-0 top-0 z-overlay flex h-(--hauteur-app) flex-col bg-background transition-opacity safe-top lg:hidden',
        ouverte ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      style={zone ? { top: zone.haut, height: zone.hauteur } : undefined}
    >
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
    </div>,
    document.body,
  );
}
