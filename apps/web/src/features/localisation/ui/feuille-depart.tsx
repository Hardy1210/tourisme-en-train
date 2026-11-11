'use client';

import { LocateFixed, TrainFront } from 'lucide-react';
import { Feuille } from '@/components/ui/feuille';
import type { GareProche } from '@/features/gares/schemas';
import { RechercheVille } from './recherche-ville';

type Proprietes = {
  ouverte: boolean;
  surChangement: (ouverte: boolean) => void;
  proches: readonly GareProche[];
  uicActuel: string | null;
  surMaPosition: () => void;
  surChoixGare: (uic: string) => void;
  surChoixPoint: (point: { lat: number; lon: number }) => void;
};

const CLASSES_LIGNE =
  'flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md px-1 text-left hover:bg-surface-sunken';

type ProprietesChoix = Omit<Proprietes, 'ouverte' | 'surChangement'>;

/** Choisir d'où l'on part : sa position, une gare proche, ou une autre ville. */
export function ChoixDepart({
  proches,
  uicActuel,
  surMaPosition,
  surChoixGare,
  surChoixPoint,
}: ProprietesChoix) {
  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={surMaPosition} className={CLASSES_LIGNE}>
        <LocateFixed aria-hidden="true" className="size-5.5 flex-none text-primary" />
        <span className="text-base font-semibold">Ma position</span>
      </button>
      {proches.length > 0 && (
        <section aria-labelledby="gares-proches" className="flex flex-col gap-1">
          <h3 id="gares-proches" className="text-sm font-medium text-muted-foreground">
            Gares proches de vous
          </h3>
          <ul>
            {proches.map((gare) => (
              <li key={gare.uic}>
                <button
                  type="button"
                  aria-current={gare.uic === uicActuel ? 'true' : undefined}
                  onClick={() => surChoixGare(gare.uic)}
                  className={CLASSES_LIGNE}
                >
                  <TrainFront aria-hidden="true" className="size-5.5 flex-none text-primary" />
                  <span className="min-w-0 flex-1 text-base font-medium">{gare.nom}</span>
                  <span className="tabular text-sm text-muted-foreground">
                    {gare.dureeVeloMin} min à vélo
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="autre-ville" className="flex flex-col gap-2">
        <h3 id="autre-ville" className="text-sm font-medium text-muted-foreground">
          Une autre ville
        </h3>
        <RechercheVille surChoix={surChoixPoint} indication="Rechercher une ville ou une gare" />
      </section>
    </div>
  );
}

/** Feuille « D'où partez-vous ? » (écrans Explorer et Lieux). */
export function FeuilleDepart({ ouverte, surChangement, ...choix }: Proprietes) {
  return (
    <Feuille pleinEcran ouverte={ouverte} surChangement={surChangement} titre="D'où partez-vous ?">
      <ChoixDepart {...choix} />
    </Feuille>
  );
}
