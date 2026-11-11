'use client';

// Zone du bas de la page « Trajet » quand le champ Destination est actif (D085). Même recherche que la
// #94 (`filtrerDestinations`), dans la liste déjà chargée ; compteur et « Afficher » sous le champ, jamais
// collés en bas où le clavier les cacherait.
import { Clock, List, TrainFront } from 'lucide-react';
import { useEffect } from 'react';

import { Bandeau } from '@/components/ui/bandeau';
import { Bouton } from '@/components/ui/bouton';
import { parametres } from '@/config/parametres';
import { couleurTranche, formaterDuree } from '@/features/destinations/presentation';
import type { Destination } from '@/features/destinations/schemas';
import { cn } from '@/lib/classes';

import { TEXTES_TRAJET } from '../contenu-trajet';
import type { Depart } from '../depart';
import type { Filtres } from '../filtres';
import { useListeDestinations } from '../liste-destinations';
import { filtrerDestinations } from '../recherche-destination';

type Proprietes = {
  depart: Extract<Depart, { etat: 'pret' }>;
  filtres: Filtres;
  texte: string;
  /** Code de la gare d'avant un changement de départ : la destination choisie est à revérifier. */
  verifierDepuis: string | null;
  surVerification: (possible: boolean) => void;
  message: string | null;
  surChoix: (destination: Destination) => void;
  surAfficher: () => void;
  surVoirToutes: () => void;
  surEffacerTexte: () => void;
  surEffacerFiltres: () => void;
};

export function ZoneDestination({
  depart,
  filtres,
  texte,
  verifierDepuis,
  surVerification,
  message,
  surChoix,
  surAfficher,
  surVoirToutes,
  surEffacerTexte,
  surEffacerFiltres,
}: Proprietes) {
  const { avantRecherche } = useListeDestinations(depart.gare.uic, filtres);

  // Nouveau départ chargé : la destination déjà choisie y a-t-elle encore un train direct ?
  const aVerifier =
    verifierDepuis !== null && depart.gare.uic !== verifierDepuis && avantRecherche !== undefined;
  useEffect(() => {
    if (aVerifier && avantRecherche)
      surVerification(filtrerDestinations(avantRecherche, filtres).length > 0);
  }, [aVerifier, avantRecherche, filtres, surVerification]);

  const tape = texte.trim() !== '';
  const trouvees = avantRecherche
    ? filtrerDestinations(avantRecherche, { recherche: texte, destination: null })
    : [];
  const proches = avantRecherche
    ? [...avantRecherche]
        .sort((a, b) => a.dureeMin - b.dureeMin)
        .slice(0, parametres.recherche.destinationsProchesMax)
    : [];

  return (
    <div className="flex flex-col gap-3">
      {message && <Bandeau variante="avertissement">{message}</Bandeau>}
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrainFront aria-hidden="true" className="size-4 flex-none text-primary" />
        <span>
          {TEXTES_TRAJET.depuis}{' '}
          <strong className="font-semibold text-primary">{depart.gare.nom}</strong>
        </span>
      </p>
      <Bouton variante="secondaire" className="w-full" onClick={surVoirToutes}>
        <List aria-hidden="true" className="size-4.5" />
        {TEXTES_TRAJET.voirToutes}
      </Bouton>

      {!tape && proches.length > 0 && (
        <section aria-labelledby="trajet-plus-proches" className="flex flex-col">
          <h3 id="trajet-plus-proches" className="text-base font-semibold">
            {TEXTES_TRAJET.plusProches}
          </h3>
          <ListeDestinations destinations={proches} surChoix={surChoix} />
        </section>
      )}

      {!tape && avantRecherche?.length === 0 && (
        <p className="text-sm text-muted-foreground">{TEXTES_TRAJET.aucunTrain}</p>
      )}

      {avantRecherche === undefined && (
        <p className="text-sm text-muted-foreground">{TEXTES_TRAJET.chargement}</p>
      )}

      {tape && avantRecherche !== undefined && trouvees.length === 0 && (
        <div className="flex flex-col gap-3 py-2">
          <p role="status" className="text-base font-semibold">
            {TEXTES_TRAJET.aucune(texte.trim())}
          </p>
          <p className="text-sm text-muted-foreground">{TEXTES_TRAJET.aucuneTexte}</p>
          <Bouton variante="secondaire" className="w-full" onClick={surEffacerTexte}>
            {TEXTES_TRAJET.effacer}
          </Bouton>
          <Bouton variante="secondaire" className="w-full" onClick={surEffacerFiltres}>
            {TEXTES_TRAJET.effacerFiltres}
          </Bouton>
        </div>
      )}

      {tape && avantRecherche && trouvees.length > 0 && (
        <>
          <p role="status" className="tabular text-base text-muted-foreground">
            {TEXTES_TRAJET.compte(trouvees.length, avantRecherche.length)}
          </p>
          <Bouton className="w-full" onClick={surAfficher}>
            {TEXTES_TRAJET.afficher(trouvees.length)}
          </Bouton>
          <ListeDestinations destinations={trouvees} surChoix={surChoix} />
        </>
      )}
    </div>
  );
}

function ListeDestinations({
  destinations,
  surChoix,
}: {
  destinations: readonly Destination[];
  surChoix: (destination: Destination) => void;
}) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {destinations.map((destination) => (
        <li key={destination.gare.uic}>
          <button
            type="button"
            onClick={() => surChoix(destination)}
            className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md px-1 py-2 text-left hover:bg-surface-sunken"
          >
            <span
              aria-hidden="true"
              className={cn(
                'size-2.5 flex-none rounded-pill',
                couleurTranche(destination.trancheTemps, parametres.durees.tranchesTempsMin),
              )}
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-base font-semibold">{destination.titre}</span>
              <span className="truncate text-sm text-muted-foreground">
                {TEXTES_TRAJET.ligneGare(destination.gare.nom, destination.nbTrains)}
              </span>
            </span>
            <span className="flex flex-none items-center gap-1 text-base font-semibold text-primary">
              <Clock aria-hidden="true" className="size-4" />
              <span className="tabular">{formaterDuree(destination.dureeMin)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
