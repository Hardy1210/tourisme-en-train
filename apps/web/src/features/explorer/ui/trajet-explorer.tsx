'use client';

// Barre du trajet + feuille « Où allez-vous ? » d'Explorer, une fois la gare de départ prête (D084).
import { useState } from 'react';

import { amorcerClavier } from '@/lib/amorce-clavier';

import type { Depart } from '../depart';
import type { Filtres } from '../filtres';
import type { useChoixDepart } from '../hooks';
import { useListeDestinations } from '../liste-destinations';
import { libelleDestination, type Recherche } from '../recherche-destination';
import { BarreTrajet } from './barre-trajet';
import { FeuilleDestination } from './feuille-destination';

type Proprietes = {
  choix: ReturnType<typeof useChoixDepart>;
  depart: Extract<Depart, { etat: 'pret' }>;
  filtres: Filtres;
  surModification: (modifications: Partial<Filtres>) => void;
  /** Après une recherche : la feuille de résultats monte au plus haut et montre la destination. */
  surResultats: () => void;
};

export function TrajetExplorer({
  choix,
  depart,
  filtres,
  surModification,
  surResultats,
}: Proprietes) {
  const [destinationOuverte, setDestinationOuverte] = useState(false);
  const { avantRecherche, liste } = useListeDestinations(depart.gare.uic, filtres);
  // Appelé une fois la feuille « Où allez-vous ? » refermée.
  const appliquer = (recherche: Recherche) => {
    surModification(recherche);
    surResultats();
  };

  return (
    <>
      <BarreTrajet
        depart={choix.libelle}
        destination={libelleDestination(filtres, liste?.length ?? 0)}
        // Le départ se choisit dans la feuille « D'où partez-vous ? » d'avant.
        surDepart={() => choix.setFeuilleOuverte(true)}
        surDestination={() => {
          amorcerClavier(); // le clavier vient avec la page « Où allez-vous ? »
          setDestinationOuverte(true);
        }}
        surEffacer={() => surModification({ recherche: '', destination: null })}
      />
      <FeuilleDestination
        ouverte={destinationOuverte}
        surChangement={setDestinationOuverte}
        destinations={avantRecherche}
        rechercheActuelle={filtres.recherche}
        surAppliquer={appliquer}
      />
    </>
  );
}
