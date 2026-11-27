import { Bike, Footprints, Lightbulb, MapPin, SquareParking, TrainFront } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';
import { cn } from '@/lib/classes';
import { formaterDistance, formaterDureeEstimee } from '@/lib/geo/formats';

import { accesGare, accesGareProche } from '../acces-gare';
import { LienItineraire } from './lien-itineraire';

type Proprietes = {
  nom: string;
  distanceM: number | null;
  /** Un parking vélo à la gare : seule preuve d'une durée à vélo (D097). */
  parkingVelo: boolean;
  /** Coordonnées de la gare : seule destination du lien « Voir l’itinéraire » (D096). */
  coordonnees: { lat: number; lon: number };
  /**
   * Billet : « 10:07 », ou « aucun aujourd'hui » (`aucun`), vers une destination ; null tant qu'on ne le
   * connaît pas ou s'il n'y a plus de train.
   */
  prochain: { valeur: string; vers: string; aucun: boolean } | null;
  surChangement: () => void;
  /**
   * Quand la gare proposée n'est pas la plus proche (D064) : le dire, et y revenir d'un geste. Son trajet suit
   * la même règle que partout (D097) : à pied, à vélo avec un parking, ou la distance.
   */
  plusProche: { nom: string; distanceM: number; parkingVelo: boolean; surChoix: () => void } | null;
};

/** Ligne d'accès : à pied jusqu'à `rayonPiedM`, à vélo avec un parking, sinon à vol d'oiseau (D097, D102). */
function LigneAcces({ distanceM, parkingVelo }: { distanceM: number; parkingVelo: boolean }) {
  const acces = accesGare(distanceM, parkingVelo);
  const [Icone, fort, discret] =
    acces.dureeMarcheMin !== null
      ? [Footprints, `${formaterDureeEstimee(acces.dureeMarcheMin)} à pied`, `· ${acces.distance}`]
      : acces.dureeVeloMin !== null
        ? [Bike, `${formaterDureeEstimee(acces.dureeVeloMin)} à vélo`, `· ${acces.distance}`]
        : [MapPin, formaterDistance(distanceM), "à vol d'oiseau"];
  return (
    <>
      <span className="flex size-8 flex-none items-center justify-center rounded-pill bg-tuile-sur-marque-bg">
        <Icone aria-hidden="true" className="size-4.5" />
      </span>
      <span className="tabular min-w-0 flex-1 text-sm">
        <strong className="font-semibold">{fort}</strong>{' '}
        <span className="text-hero-muted">{discret}</span>
      </span>
    </>
  );
}

/** « Votre gare » en billet (maquette Explorer-B-Max-2, états A1 à A7), sur la surface de la marque. */
export function CarteVotreGare({
  nom,
  distanceM,
  parkingVelo,
  coordonnees,
  prochain,
  surChangement,
  plusProche,
}: Proprietes) {
  // Une seule règle, que la gare proposée soit la plus proche ou non (essai iPhone du 17/11, D097).
  const aVelo = distanceM !== null && accesGare(distanceM, parkingVelo).dureeVeloMin !== null;
  return (
    <section
      aria-labelledby="votre-gare"
      className="flex flex-col gap-3.5 rounded-carte bg-hero-bg p-4 text-hero-foreground shadow-carte"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-12 flex-none items-center justify-center rounded-md bg-tuile-sur-marque-bg">
          <TrainFront aria-hidden="true" className="size-6" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs text-hero-muted">Votre gare</span>
          <h2 id="votre-gare" className="font-display text-2xl leading-tight font-extrabold">
            {nom}
          </h2>
          {aVelo && (
            <span className="mt-0.5 flex items-center gap-1 text-xs text-hero-muted">
              <SquareParking aria-hidden="true" className="size-3.5" />
              Parking vélo à la gare
            </span>
          )}
        </div>
        {/* Pastille de 32 px dans une zone de toucher de 44 px. */}
        <button
          type="button"
          onClick={surChangement}
          aria-label="Changer de gare"
          className="flex min-h-touch flex-none cursor-pointer items-center"
        >
          <span className="flex h-8 items-center rounded-pill bg-tuile-sur-marque-bg px-3 text-sm font-semibold">
            Changer
          </span>
        </button>
      </div>

      {prochain && (
        <p className="flex items-stretch rounded-md bg-tuile-sur-marque-bg">
          <span className="flex min-w-20 flex-col justify-center gap-0.5 px-3.5 py-3">
            <span className="text-xs text-hero-muted">Prochain direct</span>
            <strong
              className={cn(
                'tabular font-display leading-none font-extrabold',
                prochain.aucun ? 'text-lg leading-tight' : 'text-3xl text-action-sur-marque',
              )}
            >
              {prochain.valeur}
            </strong>
          </span>
          {/* Pointillés et encoches du billet : décor, de la couleur du fond qui les entoure. */}
          <span aria-hidden="true" className="relative w-0.5 flex-none">
            <span className="absolute inset-y-3 left-0 border-l-2 border-dashed border-pointilles-sur-marque" />
            <span className="absolute -top-2.25 -left-2 size-4.5 rounded-pill bg-hero-bg" />
            <span className="absolute -bottom-2.25 -left-2 size-4.5 rounded-pill bg-hero-bg" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3.5 py-3">
            <span className="text-xs text-hero-muted">Vers</span>
            <strong className="truncate font-display text-xl leading-tight font-extrabold">
              {prochain.vers}
            </strong>
          </span>
        </p>
      )}

      {/* Sans distance (gare choisie à la main, position refusée), le lien reste : il faut toujours y aller. */}
      <div className="flex items-center gap-2.5">
        {distanceM !== null && <LigneAcces distanceM={distanceM} parkingVelo={parkingVelo} />}
        <LienItineraire gare={coordonnees} surMarque />
      </div>

      {plusProche && (
        <div className="flex flex-col gap-2.5 border-t border-trait-sur-marque pt-3">
          <p className="flex gap-2 text-sm text-hero-muted">
            <Lightbulb
              aria-hidden="true"
              className="mt-px size-4.5 flex-none text-action-sur-marque"
            />
            <span className="tabular flex flex-col">
              <strong className="font-semibold text-hero-foreground">
                Plus proche : {plusProche.nom},{' '}
                {accesGareProche(plusProche.distanceM, plusProche.parkingVelo).texte}
              </strong>
              <span>{nom} a plus de trains, sans perdre de destination</span>
            </span>
          </p>
          <Bouton variante="secondaire" className="w-full" onClick={plusProche.surChoix}>
            Partir de {plusProche.nom}
          </Bouton>
        </div>
      )}
    </section>
  );
}
