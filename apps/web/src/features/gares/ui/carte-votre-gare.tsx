import { Bike, Footprints, TrainFront } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';
import { Carte } from '@/components/ui/carte';
import { formaterDistance } from '@/lib/geo/formats';

type Proprietes = {
  nom: string;
  distanceM: number | null;
  dureeMarcheMin: number | null;
  dureeVeloMin: number | null;
  /** « 10:12 → Beaune » ; null tant qu'on ne le connaît pas ou s'il n'y en a plus. */
  prochainDepart: string | null;
  surChangement: () => void;
  /** Quand la gare proposée n'est pas la plus proche (D064) : le dire, et y revenir d'un geste. */
  plusProche: { nom: string; dureeMarcheMin: number; surChoix: () => void } | null;
};

export function CarteVotreGare({
  nom,
  distanceM,
  dureeMarcheMin,
  dureeVeloMin,
  prochainDepart,
  surChangement,
  plusProche,
}: Proprietes) {
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
        </div>
        {distanceM !== null && plusProche !== null && dureeMarcheMin !== null ? (
          <span className="tabular flex items-center gap-1 text-sm whitespace-nowrap text-muted-foreground">
            <Footprints aria-hidden="true" className="size-4" />
            {dureeMarcheMin} min à pied · {formaterDistance(distanceM)}
          </span>
        ) : (
          distanceM !== null &&
          dureeVeloMin !== null && (
            <span className="tabular flex items-center gap-1 text-sm whitespace-nowrap text-muted-foreground">
              <Bike aria-hidden="true" className="size-4 text-transit" />
              {dureeVeloMin} min · {formaterDistance(distanceM)}
            </span>
          )
        )}
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
            {plusProche.dureeMarcheMin} min à pied. Celle-ci a plus de trains, sans perdre de
            destination.
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
