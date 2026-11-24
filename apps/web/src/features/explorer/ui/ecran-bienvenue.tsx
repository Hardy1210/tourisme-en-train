'use client';

// Écran de bienvenue du premier lancement (D113, maquette « Accueil », écran 1) : plein écran sur le fond
// de la marque, au-dessus du menu. La position n'est demandée qu'au toucher de « Utiliser ma position » :
// la fenêtre du téléphone arrive après l'explication, jamais à l'ouverture. Choisir une ville ou une gare
// passe par les fonctions de départ habituelles : la barre d'Explorer montre ensuite ce choix.
import { LocateFixed, Lock, TrainFront } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useState } from 'react';
import { Bouton } from '@/components/ui/bouton';
import { Logo } from '@/components/ui/logo';
import { parametres } from '@/config/parametres';
import { BoutonCreditPhoto } from '@/features/lieux/ui/photo-lieu';
import { RechercheVille } from '@/features/localisation/ui/recherche-ville';
import { photoAuHasard } from '../accueil';
import { TEXTES_ACCUEIL as T } from '../contenu-accueil';
import type { useChoixDepart } from '../hooks';
import { PHOTOS_ACCUEIL } from '../photos-accueil';
import { ErreurChoixDepart } from './controles-depart';

type Proprietes = {
  choix: ReturnType<typeof useChoixDepart>;
  /** Départ choisi (position, ville ou gare) : l'accueil se ferme et ne reviendra plus. */
  surTerminer: () => void;
};

export function EcranBienvenue({ choix, surTerminer }: Proprietes) {
  // Une photo au hasard à chaque ouverture ; écran rendu dans le navigateur seulement (Explorer, D069).
  const [{ photo, cadrage }] = useState(() => photoAuHasard(PHOTOS_ACCUEIL, Math.random()));
  const choisirGare = (uic: string) => {
    surTerminer();
    choix.choisirGareEtFermer(uic);
  };
  const choisirPoint = async (point: { lat: number; lon: number }) => {
    if (await choix.choisirPoint(point)) surTerminer();
  };

  return (
    // Fenêtre modale : le menu et Explorer, dessous, sont cachés aux lecteurs d'écran. On ne la ferme
    // qu'en choisissant un départ (pas d'Échap).
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Content
          onOpenAutoFocus={(evenement) => evenement.preventDefault()}
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

            <div className="flex flex-col gap-4 px-6 pt-3.5 pb-6">
              <Logo surHero />
              <div className="flex flex-col gap-2">
                <Dialog.Title asChild>
                  <h1 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-pretty">
                    {T.titre}
                  </h1>
                </Dialog.Title>
                <Dialog.Description className="text-base text-pretty text-page-marque-texte-muted">
                  {T.texte}
                </Dialog.Description>
              </div>
              <Bouton variante="sortie" className="h-13 text-lg font-bold" onClick={surTerminer}>
                <LocateFixed aria-hidden="true" className="size-5" />
                {T.utiliserPosition}
              </Bouton>
              <div
                aria-hidden="true"
                className="flex items-center gap-3 text-sm text-page-marque-texte-muted"
              >
                <span className="h-px flex-1 bg-tuile-sur-marque-bg" />
                {T.ou}
                <span className="h-px flex-1 bg-tuile-sur-marque-bg" />
              </div>
              <RechercheVille
                surChoix={(point) => void choisirPoint(point)}
                indication={T.champ}
                surMarque
              />
              <ErreurChoixDepart choix={choix} />
              <div role="group" aria-label={T.suggestions} className="flex flex-wrap gap-2">
                {parametres.region.garesPrincipales.slice(0, 3).map((gare) => (
                  <Bouton
                    key={gare.uic}
                    variante="sur-marque"
                    onClick={() => choisirGare(gare.uic)}
                  >
                    <TrainFront aria-hidden="true" className="size-4" />
                    {gare.ville}
                  </Bouton>
                ))}
              </div>
              <p className="flex items-center gap-1.5 text-sm text-page-marque-texte-muted">
                <Lock aria-hidden="true" className="size-4 flex-none" />
                {T.confidentialite}
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
