'use client';

import { ChevronRight, Search, TrainFront } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';
import { marque } from '@/config/marque';
import { parametres } from '@/config/parametres';

type Proprietes = { surChoixGare: (uic: string) => void; surRecherche: () => void };

export function EcranHorsRegion({ surChoixGare, surRecherche }: Proprietes) {
  const { nom, garesPrincipales } = parametres.region;
  const [premiere] = garesPrincipales;
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-pretty">
          {marque.nom} arrive bientôt près de chez vous
        </h1>
        <p className="text-base text-pretty text-muted-foreground">
          Pour l&apos;instant, {marque.nom} couvre la {nom}. Choisissez une gare de départ dans la
          région pour explorer les sorties en train.
        </p>
      </div>
      {premiere && (
        <Bouton className="h-13 text-base" onClick={() => surChoixGare(premiere.uic)}>
          <TrainFront aria-hidden="true" className="size-4.5" />
          Partir de {premiere.ville}
        </Bouton>
      )}
      <section aria-labelledby="grandes-gares" className="flex flex-col gap-2">
        <h2 id="grandes-gares" className="text-lg font-bold">
          Grandes gares de la région
        </h2>
        <ul className="flex flex-col overflow-hidden rounded-carte bg-carte-bg shadow-carte">
          {garesPrincipales.map((gare) => (
            <li key={gare.uic} className="border-b last:border-b-0">
              <button
                type="button"
                onClick={() => surChoixGare(gare.uic)}
                className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-3 text-left hover:bg-surface-sunken"
              >
                <TrainFront aria-hidden="true" className="size-5 flex-none text-primary" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-base font-semibold">{gare.ville}</span>
                  <span className="text-sm text-muted-foreground">{gare.departement}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-4.5 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </section>
      <Bouton variante="secondaire" onClick={surRecherche}>
        <Search aria-hidden="true" className="size-4.5" />
        Rechercher une ville ou une gare
      </Bouton>
    </div>
  );
}
