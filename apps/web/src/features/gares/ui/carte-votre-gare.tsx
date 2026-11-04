import { Bike, TrainFront } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';
import { Carte } from '@/components/ui/carte';
import { formaterDistance } from '@/lib/geo/formats';

type Proprietes = {
  nom: string;
  distanceM: number | null;
  dureeVeloMin: number | null;
  surChangement: () => void;
};

export function CarteVotreGare({ nom, distanceM, dureeVeloMin, surChangement }: Proprietes) {
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
        {distanceM !== null && dureeVeloMin !== null && (
          <span className="tabular flex items-center gap-1 text-sm whitespace-nowrap text-muted-foreground">
            <Bike aria-hidden="true" className="size-4 text-transit" />
            {dureeVeloMin} min · {formaterDistance(distanceM)}
          </span>
        )}
      </div>
      <Bouton variante="secondaire" onClick={surChangement}>
        Changer de gare
      </Bouton>
    </Carte>
  );
}
