'use client';

// Barre du trajet + feuille « Votre trajet » d'Explorer, une fois la gare de départ prête (D084).
import { useState } from 'react';

import type { Depart } from '../depart';
import type { Filtres } from '../filtres';
import type { useChoixDepart } from '../hooks';
import { useListeDestinations } from '../liste-destinations';
import { libelleDestination, type Recherche } from '../recherche-destination';
import { BarreTrajet } from './barre-trajet';
import { FeuilleTrajet, type ModeTrajet } from './feuille-trajet';

type Proprietes = {
  choix: ReturnType<typeof useChoixDepart>;
  depart: Extract<Depart, { etat: 'pret' }>;
  filtres: Filtres;
  surModification: (modifications: Partial<Filtres>) => void;
  /** Après une recherche : la feuille de résultats monte au plus haut, sous les catégories. */
  surResultats: () => void;
};

export function TrajetExplorer({
  choix,
  depart,
  filtres,
  surModification,
  surResultats,
}: Proprietes) {
  const [mode, setMode] = useState<ModeTrajet | null>(null);
  const { avantRecherche, liste } = useListeDestinations(depart.gare.uic, filtres);
  // « Changer de gare » (carte « Votre gare », hors région) ouvre la même feuille, sur le départ.
  const ouverte = mode !== null || choix.feuilleOuverte;
  const fermer = () => {
    setMode(null);
    choix.setFeuilleOuverte(false);
  };
  const appliquer = (recherche: Recherche) => {
    surModification(recherche);
    fermer();
    surResultats();
  };

  return (
    <>
      <BarreTrajet
        depart={choix.libelle}
        destination={libelleDestination(filtres, liste?.length ?? 0)}
        surDepart={() => setMode('depart')}
        surDestination={() => setMode('destination')}
        surEffacer={() => surModification({ recherche: '', destination: null })}
      />
      <FeuilleTrajet
        ouverte={ouverte}
        surChangement={(etat) => {
          if (!etat) fermer();
        }}
        mode={mode ?? 'depart'}
        libelleDepart={choix.libelle}
        choixDepart={{
          proches: depart.proches,
          uicActuel: depart.gare.uic,
          surMaPosition: () => {
            fermer();
            choix.revenirAMaPosition();
          },
          surChoixGare: (uic) => {
            fermer();
            choix.choisirGareEtFermer(uic);
          },
          surChoixPoint: (point) => {
            void choix.choisirPoint(point).then(() => setMode(null));
          },
        }}
        destinations={avantRecherche}
        rechercheActuelle={filtres.recherche}
        surAppliquer={appliquer}
      />
    </>
  );
}
