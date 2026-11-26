'use client';

// Écran 1 de l'accueil (D113, maquette « Accueil ») : la position n'est demandée qu'au toucher de « Utiliser
// ma position » ; la fenêtre du téléphone arrive après l'explication, jamais à l'ouverture. Ville et gare
// passent par les fonctions de départ habituelles : la barre d'Explorer montrera ce choix.
import { LocateFixed, Lock, TrainFront } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';
import { Logo } from '@/components/ui/logo';
import { GARES_SUGGEREES } from '@/features/localisation/gares-suggerees';
import { RechercheVille } from '@/features/localisation/ui/recherche-ville';
import { TEXTES_ACCUEIL as T } from '../contenu-accueil';
import type { useChoixDepart } from '../hooks';
import { TitreAccueil } from './cadre-accueil';
import { ErreurChoixDepart } from './controles-depart';

type Proprietes = {
  choix: ReturnType<typeof useChoixDepart>;
  /** Départ choisi : la position (demandée à ce moment), ou une ville ou une gare. */
  surChoix: (choix: 'position' | 'gare') => void;
};

export function AccueilBienvenue({ choix, surChoix }: Proprietes) {
  const choisirGare = (uic: string) => {
    surChoix('gare');
    choix.choisirGareEtFermer(uic);
  };
  const choisirPoint = async (point: { lat: number; lon: number }) => {
    if (await choix.choisirPoint(point)) surChoix('gare');
  };

  return (
    <>
      <Logo surHero />
      <TitreAccueil titre={T.titre} texte={T.texte} />
      <Bouton
        variante="sortie"
        className="h-13 text-lg font-bold"
        onClick={() => surChoix('position')}
      >
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
        {GARES_SUGGEREES.map((gare) => (
          <Bouton
            key={gare.uic}
            variante="sur-marque"
            className="gap-1.5 px-3.5 text-sm"
            onClick={() => choisirGare(gare.uic)}
          >
            <TrainFront aria-hidden="true" className="size-4" />
            {gare.ville}
          </Bouton>
        ))}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-page-marque-texte-muted">
        <Lock aria-hidden="true" className="size-3.5 flex-none" />
        {T.confidentialite}
      </p>
    </>
  );
}
