'use client';

// Cadre des écrans de l'accueil (D113, maquette « Accueil ») : plein écran sur le fond de la marque, au-dessus
// du menu, photo en haut dans la courbe de la fiche lieu (`entete-arc`) avec son crédit ⓘ. Le cadre reste
// monté d'un écran à l'autre : la photo, tirée au hasard, ne change pas en cours de route.
import { Dialog } from 'radix-ui';
import { useState, type ReactNode } from 'react';
import { BoutonCreditPhoto } from '@/features/lieux/ui/photo-lieu';
import { photoAuHasard } from '../accueil';
import { PHOTOS_ACCUEIL } from '../photos-accueil';

export function CadreAccueil({ children }: { children: ReactNode }) {
  // Écran rendu dans le navigateur seulement (Explorer, D069) : le hasard ne crée aucun écart avec le serveur.
  const [{ photo, cadrage }] = useState(() => photoAuHasard(PHOTOS_ACCUEIL, Math.random()));

  return (
    // Fenêtre modale : le menu et Explorer, dessous, sont cachés aux lecteurs d'écran. On ne la ferme
    // qu'en choisissant (pas d'Échap) ; à la fermeture, le focus va où l'écran suivant le met.
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Content
          onOpenAutoFocus={(evenement) => evenement.preventDefault()}
          onCloseAutoFocus={(evenement) => evenement.preventDefault()}
          onEscapeKeyDown={(evenement) => evenement.preventDefault()}
          className="fixed inset-0 z-overlay overflow-y-auto overscroll-contain bg-page-marque-bg text-page-marque-texte"
        >
          <div className="mx-auto flex w-full max-w-md flex-col safe-bottom">
            <div className="@container relative flex-none">
              <div className="entete-arc">
                <div className="entete-arc-contenu">
                  {/* Fichier local déjà à la bonne taille (public/accueil/) : pas besoin de `next/image`. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.grande}
                    alt=""
                    decoding="async"
                    className="size-full object-cover"
                    style={{ objectPosition: cadrage }}
                  />
                </div>
              </div>
              <div className="absolute top-(--retour-haut) right-(--retour-bord)">
                <BoutonCreditPhoto photo={photo} surPhoto alignement="end" />
              </div>
            </div>
            <div className="flex flex-col gap-4 px-6 pt-3.5 pb-6">{children}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Titre et texte d'un écran de l'accueil : le nom et la description de la fenêtre pour les lecteurs d'écran. */
export function TitreAccueil({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Dialog.Title asChild>
        <h1 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-pretty">
          {titre}
        </h1>
      </Dialog.Title>
      <Dialog.Description className="text-base text-pretty text-page-marque-texte-muted">
        {texte}
      </Dialog.Description>
    </div>
  );
}
