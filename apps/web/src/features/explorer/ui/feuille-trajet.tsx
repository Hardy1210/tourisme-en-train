'use client';

// Feuille « Votre trajet » (D084) : « De » (le choix du départ d'avant) et « À » (recherche d'une
// destination dans la liste déjà chargée, triée par temps de trajet). Textes : `contenu-trajet.ts`.
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Bouton } from '@/components/ui/bouton';
import { ChampRecherche } from '@/components/ui/champ-recherche';
import { Feuille } from '@/components/ui/feuille';
import { parametres } from '@/config/parametres';
import { couleurTranche, formaterDuree } from '@/features/destinations/presentation';
import type { Destination } from '@/features/destinations/schemas';
import { ChoixDepart } from '@/features/localisation/ui/feuille-depart';
import { cn } from '@/lib/classes';

import { TEXTES_TRAJET } from '../contenu-trajet';
import { filtrerDestinations, type Recherche } from '../recherche-destination';

export type ModeTrajet = 'depart' | 'destination';

type Proprietes = {
  ouverte: boolean;
  surChangement: (ouverte: boolean) => void;
  mode: ModeTrajet;
  libelleDepart: string;
  choixDepart: Parameters<typeof ChoixDepart>[0];
  /** Destinations avant la recherche ; undefined pendant le chargement. */
  destinations: readonly Destination[] | undefined;
  rechercheActuelle: string;
  surAppliquer: (recherche: Recherche) => void;
};

const CLASSES_TITRE = 'text-sm font-medium text-muted-foreground';

export function FeuilleTrajet({ ouverte, surChangement, ...reste }: Proprietes) {
  return (
    <Feuille ouverte={ouverte} surChangement={surChangement} titre={TEXTES_TRAJET.titreFeuille}>
      {/* Remonté à chaque ouverture : le brouillon repart de la recherche en cours. */}
      {ouverte && <ContenuTrajet {...reste} />}
    </Feuille>
  );
}

function ContenuTrajet({
  mode,
  libelleDepart,
  choixDepart,
  destinations,
  rechercheActuelle,
  surAppliquer,
}: Omit<Proprietes, 'ouverte' | 'surChangement'>) {
  const [departDeplie, setDepartDeplie] = useState(mode === 'depart');
  const [brouillon, setBrouillon] = useState(rechercheActuelle);
  const tape = brouillon.trim() !== '';
  const trouvees = destinations
    ? filtrerDestinations(destinations, { recherche: brouillon, destination: null })
    : [];

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="trajet-de" className="flex flex-col gap-2">
        <h3 id="trajet-de" className={CLASSES_TITRE}>
          {TEXTES_TRAJET.de}
        </h3>
        <button
          type="button"
          aria-expanded={departDeplie}
          onClick={() => setDepartDeplie((deplie) => !deplie)}
          className="flex min-h-touch w-full cursor-pointer items-center gap-2 rounded-md text-left hover:bg-surface-sunken"
        >
          <span className="min-w-0 flex-1 truncate text-base font-semibold">{libelleDepart}</span>
          <span className="text-sm font-semibold text-primary">{TEXTES_TRAJET.changerDepart}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn('size-4 text-primary transition-transform', departDeplie && 'rotate-180')}
          />
        </button>
        {departDeplie && <ChoixDepart {...choixDepart} />}
      </section>

      <section aria-labelledby="trajet-a" className="flex flex-col gap-3">
        <h3 id="trajet-a" className={CLASSES_TITRE}>
          {TEXTES_TRAJET.a}
        </h3>
        <ChampRecherche
          libelle={TEXTES_TRAJET.champ}
          placeholder={TEXTES_TRAJET.champ}
          value={brouillon}
          onChange={(evenement) => setBrouillon(evenement.target.value)}
          onKeyDown={(evenement) => {
            if (evenement.key === 'Enter' && tape && trouvees.length > 0) {
              surAppliquer({ recherche: brouillon, destination: null });
            }
          }}
          enterKeyHint="search"
          autoComplete="off"
          // Ouverte pour chercher une destination : le clavier vient tout de suite.
          autoFocus={mode === 'destination'}
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
            <Bouton
              className="w-full"
              onClick={() => surAppliquer({ recherche: brouillon, destination: null })}
            >
              {TEXTES_TRAJET.afficher(trouvees.length)}
            </Bouton>
            <ul aria-label={TEXTES_TRAJET.compte(trouvees.length, destinations.length)}>
              {trouvees.map((destination) => (
                <li key={destination.gare.uic}>
                  <button
                    type="button"
                    onClick={() =>
                      surAppliquer({
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
          </>
        )}
      </section>
    </div>
  );
}
