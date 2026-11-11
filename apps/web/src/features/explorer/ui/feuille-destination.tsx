'use client';

// Feuille « Où allez-vous ? » (D084) : recherche d'une destination dans la liste déjà chargée, triée par
// temps de trajet. Même hauteur que « D'où partez-vous ? », même vide ; le bouton « Afficher » suit la
// liste. Le clavier ne vient qu'au toucher du champ.
// Textes : `contenu-trajet.ts`.
import { useRef, useState } from 'react';

import { Bouton } from '@/components/ui/bouton';
import { ChampRecherche } from '@/components/ui/champ-recherche';
import { Feuille } from '@/components/ui/feuille';
import { parametres } from '@/config/parametres';
import { couleurTranche, formaterDuree } from '@/features/destinations/presentation';
import type { Destination } from '@/features/destinations/schemas';
import { cn } from '@/lib/classes';

import { TEXTES_TRAJET } from '../contenu-trajet';
import { filtrerDestinations, type Recherche } from '../recherche-destination';

type Proprietes = {
  ouverte: boolean;
  surChangement: (ouverte: boolean) => void;
  /** Destinations avant la recherche ; undefined pendant le chargement. */
  destinations: readonly Destination[] | undefined;
  rechercheActuelle: string;
  surAppliquer: (recherche: Recherche) => void;
};

export function FeuilleDestination({
  ouverte,
  surChangement,
  destinations,
  rechercheActuelle,
  surAppliquer,
}: Proprietes) {
  // null : rien tapé depuis l'ouverture, le champ montre la recherche en cours. Remis à null une fois
  // la feuille sortie : chaque ouverture repart de la recherche en cours, sans que le contenu change
  // pendant la glissade.
  const [saisie, setSaisie] = useState<string | null>(null);
  const brouillon = saisie ?? rechercheActuelle;
  // Choix en attente : appliqué une fois la feuille sortie de l'écran (voir `apresFermeture`).
  const choix = useRef<Recherche | null>(null);
  const appliquer = (recherche: Recherche) => {
    choix.current = recherche;
    surChangement(false);
  };
  const apresFermeture = () => {
    setSaisie(null);
    const recherche = choix.current;
    choix.current = null;
    if (recherche) surAppliquer(recherche);
  };
  const tape = brouillon.trim() !== '';
  const trouvees = destinations
    ? filtrerDestinations(destinations, { recherche: brouillon, destination: null })
    : [];
  const appliquerTexte = () => appliquer({ recherche: brouillon, destination: null });

  return (
    <Feuille
      ouverte={ouverte}
      surChangement={surChangement}
      apresFermeture={apresFermeture}
      titre={TEXTES_TRAJET.titreFeuille}
      hauteurRecherche
    >
      <div className="flex flex-col gap-3">
        <ChampRecherche
          libelle={TEXTES_TRAJET.champ}
          placeholder={TEXTES_TRAJET.champ}
          value={brouillon}
          onChange={(evenement) => setSaisie(evenement.target.value)}
          onKeyDown={(evenement) => {
            if (evenement.key === 'Enter' && tape && trouvees.length > 0) appliquerTexte();
          }}
          enterKeyHint="search"
          autoComplete="off"
        />

        {tape && destinations === undefined && (
          <p className="text-sm text-muted-foreground">{TEXTES_TRAJET.chargement}</p>
        )}

        {tape && destinations !== undefined && trouvees.length === 0 && (
          <p role="status" className="text-base font-semibold">
            {TEXTES_TRAJET.aucune(brouillon.trim())}
          </p>
        )}

        {tape && trouvees.length > 0 && destinations && (
          <>
            <p role="status" className="tabular text-sm text-muted-foreground">
              {TEXTES_TRAJET.compte(trouvees.length, destinations.length)}
            </p>
            <ul aria-label={TEXTES_TRAJET.compte(trouvees.length, destinations.length)}>
              {trouvees.map((destination) => (
                <li key={destination.gare.uic}>
                  <button
                    type="button"
                    onClick={() =>
                      appliquer({
                        recherche: destination.titre,
                        destination: destination.gare.uic,
                      })
                    }
                    className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md px-1 text-left hover:bg-surface-sunken"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'size-2.5 flex-none rounded-pill',
                        couleurTranche(
                          destination.trancheTemps,
                          parametres.durees.tranchesTempsMin,
                        ),
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-base font-semibold">{destination.titre}</span>
                      <span className="truncate text-sm text-muted-foreground">
                        {TEXTES_TRAJET.ligneGare(destination.gare.nom, destination.nbTrains)}
                      </span>
                    </span>
                    <span className="tabular text-sm font-semibold">
                      {formaterDuree(destination.dureeMin)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <Bouton className="w-full" onClick={appliquerTexte}>
              {TEXTES_TRAJET.afficher(trouvees.length)}
            </Bouton>
          </>
        )}
      </div>
    </Feuille>
  );
}
