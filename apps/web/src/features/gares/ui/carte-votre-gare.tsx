import { Bike, Footprints, TrainFront } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';
import { Carte } from '@/components/ui/carte';

import { accesGare, accesGareProche } from '../acces-gare';
import { LienItineraire } from './lien-itineraire';

type Proprietes = {
  nom: string;
  distanceM: number | null;
  /** Un parking vélo à la gare : seule preuve d'une durée à vélo (D097). */
  parkingVelo: boolean;
  /** Coordonnées de la gare : seule destination du lien « Voir l’itinéraire » (D096). */
  coordonnees: { lat: number; lon: number };
  /** « 10:12 → Beaune » ; null tant qu'on ne le connaît pas ou s'il n'y en a plus. */
  prochainDepart: string | null;
  surChangement: () => void;
  /**
   * Quand la gare proposée n'est pas la plus proche (D064) : le dire, et y revenir d'un geste. Son trajet suit
   * la même règle que partout (D097) : à pied, à vélo avec un parking, ou la distance.
   */
  plusProche: { nom: string; distanceM: number; parkingVelo: boolean; surChoix: () => void } | null;
};

export function CarteVotreGare({
  nom,
  distanceM,
  parkingVelo,
  coordonnees,
  prochainDepart,
  surChangement,
  plusProche,
}: Proprietes) {
  const acces = distanceM === null ? null : accesGare(distanceM, parkingVelo);
  // Une seule règle, que la gare proposée soit la plus proche ou non (essai iPhone du 17/11, D097).
  const aVelo = acces?.dureeVeloMin != null;
  return (
    <Carte className="gap-3.5" aria-labelledby="votre-gare">
      <div className="flex items-center gap-3">
        <span className="flex size-touch flex-none items-center justify-center rounded-md bg-primary">
          <TrainFront aria-hidden="true" className="size-5.5 text-primary-foreground" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs font-medium text-muted-foreground">Votre gare</span>
          <h2 id="votre-gare" className="text-xl font-bold">
            {nom}
          </h2>
          {aVelo && <span className="text-sm text-muted-foreground">Parking vélo à la gare</span>}
        </div>
        {/* Sous la distance, dans la hauteur du titre : la carte ne grandit pas, la feuille non plus. Le lien
            reste sans distance (gare choisie à la main, position refusée) : il faut toujours y aller. */}
        <div className="flex flex-none flex-col items-end gap-0.5">
          {distanceM !== null && (
            <span className="tabular flex items-center gap-1 text-sm whitespace-nowrap text-muted-foreground">
              {acces?.dureeMarcheMin != null ? (
                <>
                  <Footprints aria-hidden="true" className="size-4" />
                  {acces.dureeMarcheMin} min à pied · {acces.distance}
                </>
              ) : aVelo ? (
                <>
                  <Bike aria-hidden="true" className="size-4" />
                  <span>≈ {acces?.dureeVeloMin} min à vélo</span>
                </>
              ) : (
                acces?.distance
              )}
            </span>
          )}
          {/* À vélo, la distance en dessous, en plus petit, comme la preuve sous le nom (essai iPhone, 17/11). */}
          {aVelo && (
            <span className="tabular text-xs whitespace-nowrap text-muted-foreground">
              {acces?.distance}
            </span>
          )}
          <LienItineraire gare={coordonnees} />
        </div>
      </div>
      {prochainDepart !== null && (
        <p className="flex items-center gap-2.5 rounded-md bg-primary-soft px-3 py-2.5 text-primary-soft-foreground">
          <span className="text-sm">Prochain départ direct</span>
          <span aria-hidden="true" className="h-0.5 flex-1 bg-primary opacity-35" />
          <strong className="tabular text-base">{prochainDepart}</strong>
        </p>
      )}
      {plusProche && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <p className="tabular text-sm text-muted-foreground">
            Gare la plus proche :{' '}
            <strong className="font-semibold text-foreground">{plusProche.nom}</strong>,{' '}
            {accesGareProche(plusProche.distanceM, plusProche.parkingVelo).texte}. Celle-ci a plus
            de trains, sans perdre de destination.
          </p>
          <Bouton variante="secondaire" onClick={plusProche.surChoix}>
            Partir de {plusProche.nom}
          </Bouton>
        </div>
      )}
      <Bouton variante={plusProche ? 'fantome' : 'secondaire'} onClick={surChangement}>
        Changer de gare
      </Bouton>
    </Carte>
  );
}
