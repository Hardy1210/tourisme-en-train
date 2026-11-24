'use client';

// Cadre des écrans de l'accueil (D113, maquette « Accueil ») : plein écran sur le fond de la marque, au-dessus
// du menu, photo en haut dans la courbe de la fiche lieu (`entete-arc`) avec son crédit ⓘ. Une seule photo
// par visite, tirée au hasard : elle ne change pas d'un écran à l'autre (bienvenue, « Dans quelle ville »,
// gare de départ). `pleinEcran={false}` : dans la page (onglet Lieux), menu du bas visible.
//
// `modale` : fenêtre modale (Radix), qui cache le menu et Explorer aux lecteurs d'écran et garde le focus.
// Jamais pendant la demande de position : la fenêtre de l'iPhone ne s'ouvrait pas (bug vu par Hardy le
// 24/11 sur Safari et Chrome ; avec #171, sans fenêtre modale à ce moment, elle s'ouvrait).
import { Dialog } from 'radix-ui';
import { useState, type ReactNode } from 'react';
import { BoutonCreditPhoto } from '@/features/lieux/ui/photo-lieu';
import { photoAuHasard } from '../accueil';
import { PHOTOS_ACCUEIL, type PhotoAccueil } from '../photos-accueil';

const CLASSES_COULEURS = 'bg-page-marque-bg text-page-marque-texte';
const CLASSES_PLEIN_ECRAN = `fixed inset-0 z-overlay overflow-y-auto overscroll-contain ${CLASSES_COULEURS}`;

// Tirée une fois par chargement de la page. Ces écrans ne sont rendus que dans le navigateur (position
// inconnue côté serveur) : le hasard ne crée aucun écart avec le serveur.
let photoDeLaVisite: PhotoAccueil | null = null;
const photoPourLaVisite = () => (photoDeLaVisite ??= photoAuHasard(PHOTOS_ACCUEIL, Math.random()));

type Proprietes = {
  /** Fenêtre modale (Radix) ; jamais pendant une demande de position (voir plus haut). */
  modale: boolean;
  /** Faux : dans la page, sous l'en-tête (onglet Lieux), sans couvrir le menu. */
  pleinEcran?: boolean;
  children: ReactNode;
};

export function CadreAccueil({ modale, pleinEcran = true, children }: Proprietes) {
  const [{ photo, cadrage }] = useState(photoPourLaVisite);

  const contenu = (
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
  );

  if (!pleinEcran) return <div className={`min-h-full ${CLASSES_COULEURS}`}>{contenu}</div>;
  if (!modale) return <div className={CLASSES_PLEIN_ECRAN}>{contenu}</div>;
  return (
    // On ne la ferme qu'en choisissant (pas d'Échap) ; à la fermeture, le focus va où l'écran suivant le met.
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Content
          onOpenAutoFocus={(evenement) => evenement.preventDefault()}
          onCloseAutoFocus={(evenement) => evenement.preventDefault()}
          onEscapeKeyDown={(evenement) => evenement.preventDefault()}
          className={CLASSES_PLEIN_ECRAN}
        >
          {contenu}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const CLASSES_TITRE =
  'font-display text-3xl leading-tight font-extrabold tracking-tight text-pretty';
const CLASSES_TEXTE = 'text-base text-pretty text-page-marque-texte-muted';

/** Titre et texte d'un écran de l'accueil : le nom et la description de la fenêtre pour les lecteurs d'écran. */
export function TitreAccueil({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Dialog.Title asChild>
        <h1 className={CLASSES_TITRE}>{titre}</h1>
      </Dialog.Title>
      <Dialog.Description className={CLASSES_TEXTE}>{texte}</Dialog.Description>
    </div>
  );
}

/** Même titre, hors fenêtre modale : le texte est annoncé quand il change (`role="status"`). */
export function TitreAccueilSimple({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className={CLASSES_TITRE}>{titre}</h1>
      <p role="status" className={CLASSES_TEXTE}>
        {texte}
      </p>
    </div>
  );
}
