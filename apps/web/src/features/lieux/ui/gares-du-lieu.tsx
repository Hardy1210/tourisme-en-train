import { Footprints, TrainFront } from 'lucide-react';
import { formaterDistance, formaterDureeEstimee } from '@/lib/geo/formats';
import type { FicheLieu } from '../schemas';

/**
 * Gares proches du lieu, sur une carte de surface de marque (maquette Fiche-Lieu) : tuile du train, nom de la
 * gare, temps et distance à pied. Plusieurs gares : une ligne chacune, séparées par un trait fin.
 */
export function GaresDuLieu({ gares }: { gares: FicheLieu['garesProches'] }) {
  if (gares.length === 0) return null;
  return (
    <section
      aria-label="Depuis la gare"
      className="flex flex-col rounded-carte bg-carte-sur-marque-bg text-carte-sur-marque-texte shadow-carte"
    >
      {gares.map((g) => (
        <div
          key={g.uic}
          className="mx-3.5 flex items-center gap-3.5 border-b border-tuile-sur-marque-bg py-3.5 last:border-b-0"
        >
          <span className="flex size-12 flex-none items-center justify-center rounded-md bg-tuile-sur-marque-bg">
            <TrainFront aria-hidden="true" className="size-6" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-lg font-bold">Gare de {g.nom}</span>
            <span className="tabular flex items-center gap-1 text-sm text-carte-sur-marque-texte-muted">
              <Footprints aria-hidden="true" className="size-4 flex-none" />
              {formaterDureeEstimee(g.dureeMarcheMin)} à pied ({formaterDistance(g.distanceM)})
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}
