'use client';

// Zone du bas de la page « Trajet » quand le champ Départ est actif (D085) : sa position, les gares
// proches (sans position : les grandes gares de la région), ou les villes et gares qui correspondent au
// texte tapé (communes seules, D081).
import { Building2, LocateFixed, TrainFront } from 'lucide-react';

import { Bandeau } from '@/components/ui/bandeau';
import { parametres } from '@/config/parametres';
import { LigneGareProche } from '@/features/gares/ui/ligne-gare-proche';
import { GARES_SUGGEREES } from '@/features/localisation/gares-suggerees';
import { useRechercheVille } from '@/features/localisation/hooks';

import { TEXTES_TRAJET } from '../contenu-trajet';
import type { useChoixDepart } from '../hooks';
import { listeSousMaPosition } from '../liste-depart';

type Proprietes = {
  texte: string;
  choix: ReturnType<typeof useChoixDepart>;
  surMaPosition: () => void;
  surGare: (uic: string) => void;
  surPoint: (point: { lat: number; lon: number }) => void;
};

const CLASSES_LIGNE =
  'flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md px-1 text-left hover:bg-surface-sunken';

export function ZoneDepart({ texte, choix, surMaPosition, surGare, surPoint }: Proprietes) {
  const { data, isFetching, isError } = useRechercheVille(texte);
  const assezLong = texte.trim().length >= parametres.localisation.longueurMinRecherche;
  const proches = choix.depart.etat === 'pret' ? choix.depart.proches : [];
  const liste = assezLong
    ? null
    : listeSousMaPosition({ positionConnue: choix.positionConnue, nombreProches: proches.length });

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={surMaPosition}
        className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 text-left hover:bg-surface-sunken"
      >
        <LocateFixed aria-hidden="true" className="size-5.5 flex-none text-primary" />
        <span className="flex min-w-0 flex-col">
          <span className="text-base font-semibold">{TEXTES_TRAJET.maPosition}</span>
          {proches[0] && (
            <span className="truncate text-sm text-muted-foreground">gare {proches[0].nom}</span>
          )}
        </span>
      </button>

      {liste === 'proches' && (
        <section aria-labelledby="trajet-gares-proches" className="flex flex-col gap-1">
          <h3 id="trajet-gares-proches" className="text-sm font-medium text-muted-foreground">
            {TEXTES_TRAJET.garesProches}
          </h3>
          <ul>
            {proches.map((gare) => (
              <li key={gare.uic}>
                <button type="button" onClick={() => surGare(gare.uic)} className={CLASSES_LIGNE}>
                  <TrainFront aria-hidden="true" className="size-5.5 flex-none text-primary" />
                  <LigneGareProche gare={gare} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {liste === 'region' && (
        <section aria-labelledby="trajet-grandes-gares" className="flex flex-col gap-1">
          <h3 id="trajet-grandes-gares" className="text-sm font-medium text-muted-foreground">
            {TEXTES_TRAJET.garesRegion}
          </h3>
          <ul>
            {GARES_SUGGEREES.map((gare) => (
              <li key={gare.uic}>
                <button type="button" onClick={() => surGare(gare.uic)} className={CLASSES_LIGNE}>
                  <TrainFront aria-hidden="true" className="size-5.5 flex-none text-primary" />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-base font-semibold">{gare.ville}</span>
                    <span className="text-sm text-muted-foreground">{gare.departement}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {assezLong && (
        <section aria-labelledby="trajet-autre-ville" className="flex flex-col gap-1">
          <h3 id="trajet-autre-ville" className="text-base font-semibold">
            {TEXTES_TRAJET.autreVille}
          </h3>
          {isError && <Bandeau variante="danger">La recherche ne répond pas. Réessayez.</Bandeau>}
          {data?.horsLigne && (
            <Bandeau variante="avertissement">
              Hors ligne : seules les gares sont proposées.
            </Bandeau>
          )}
          {!isFetching && !isError && data?.resultats.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">
              Aucun résultat pour cette recherche.
            </p>
          )}
          <ul>
            {data?.resultats.map((resultat) => {
              const Icone = resultat.type === 'gare' ? TrainFront : Building2;
              return (
                <li key={`${resultat.type}-${resultat.lat}-${resultat.lon}`}>
                  <button
                    type="button"
                    onClick={() => surPoint({ lat: resultat.lat, lon: resultat.lon })}
                    className={CLASSES_LIGNE}
                  >
                    <Icone aria-hidden="true" className="size-5 flex-none text-muted-foreground" />
                    <span className="min-w-0 flex-1 text-base">{resultat.libelle}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
