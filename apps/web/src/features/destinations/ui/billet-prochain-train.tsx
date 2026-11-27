import { Clock, Moon } from 'lucide-react';
import { formaterDuree, type BilletDestination } from '../presentation';

type Proprietes = {
  billet: BilletDestination;
  /** Gare de départ, sous l'heure de départ. */
  depart: string;
  /** Destination, sous l'heure d'arrivée. */
  arrivee: string;
};

/** Nom lu par un lecteur d'écran, et repère des parcours : « Prochain train : 10:12 → 10:23, 11 min ». */
function nomAccessible(billet: BilletDestination): string {
  if (billet.etat === 'train') {
    return `Prochain train : ${billet.depart} → ${billet.arrivee}, ${formaterDuree(billet.dureeMin)}`;
  }
  return `Prochain train : ${billet.etat === 'miseAJour' ? 'mise à jour…' : billet.texte.toLowerCase()}`;
}

/**
 * Case « Prochain train » de la carte de destination (maquette V2, D125) : la ligne ne porte que les deux heures
 * (chiffres à largeur fixe) et la pastille de durée, qui ne peut donc pas bouger ; les noms de gare passent
 * dessous, chacun sur sa moitié, coupés par « … ». Sans train, même place et même hauteur.
 */
export function BilletProchainTrain({ billet, depart, arrivee }: Proprietes) {
  return (
    <div
      role="group"
      aria-label={nomAccessible(billet)}
      className="flex flex-col gap-1.5 rounded-md bg-primary-soft px-3 py-2.5"
    >
      <span aria-hidden="true" className="text-xs font-semibold text-muted-foreground">
        Prochain train
      </span>
      {billet.etat === 'train' ? (
        <div aria-hidden="true" className="flex min-h-12 flex-col justify-center gap-0.5">
          <div className="flex items-center gap-2">
            <strong className="tabular font-display text-2xl leading-none font-extrabold text-primary">
              {billet.depart}
            </strong>
            <span className="relative flex h-7 flex-1 items-center justify-center">
              <span className="absolute inset-x-0 top-1/2 border-t-2 border-primary" />
              <span className="tabular relative flex h-7 items-center gap-1 rounded-pill bg-pastille-train-bg px-2.5 text-sm font-bold whitespace-nowrap text-pastille-train-texte">
                <Clock className="size-3.5" />
                {formaterDuree(billet.dureeMin)}
              </span>
            </span>
            <strong className="tabular font-display text-2xl leading-none font-extrabold text-primary">
              {billet.arrivee}
            </strong>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="min-w-0 flex-1 truncate">{depart}</span>
            <span className="min-w-0 flex-1 truncate text-right">{arrivee}</span>
          </div>
        </div>
      ) : (
        <p aria-hidden="true" className="flex min-h-12 items-center gap-2 text-md font-semibold">
          <Moon className="size-4.5 flex-none text-muted-foreground" />
          {billet.etat === 'miseAJour' ? 'mise à jour…' : billet.texte}
        </p>
      )}
    </div>
  );
}
