'use client';

import { parametres } from '@/config/parametres';
import { useDestinations } from '@/features/destinations/hooks';
import { dureeElargie, prochainTrainDirect } from '@/features/destinations/presentation';
import { SectionDestinations } from '@/features/destinations/ui/section-destinations';
import type { Destination } from '@/features/destinations/schemas';
import { CarteVotreGare } from '@/features/gares/ui/carte-votre-gare';
import { useLieuxAutour } from '@/features/lieux/hooks';
import { SectionAPied } from '@/features/lieux/ui/section-a-pied';
import { ErreurClient } from '@/lib/http/client';
import type { Depart } from '../depart';
import { FILTRES_PAR_DEFAUT, libelleDureeMax, libelleRayon, type Filtres } from '../filtres';

type Proprietes = {
  depart: Extract<Depart, { etat: 'pret' }>;
  filtres: Filtres;
  surModification: (modifications: Partial<Filtres>) => void;
  surChangementGare: () => void;
};

/** « Votre gare », « À deux pas de vous », « En train direct » : tout suit les filtres de l'URL. */
export function ResultatsExplorer({
  depart,
  filtres,
  surModification,
  surChangementGare,
}: Proprietes) {
  const { gare, point, origine } = depart;
  const lieux = useLieuxAutour({ point, rayon: filtres.rayon, categories: filtres.categories });
  const destinations = useDestinations({
    gare: gare.uic,
    date: filtres.date,
    categories: filtres.categories,
    dureeMax: filtres.dureeMax,
  });

  // « Faisable dans la journée » s'applique ici, dans l'interface (docs/05-api.md § 3.4).
  const liste = filtres.faisable
    ? destinations.data?.destinations.filter((d) => d.faisableJournee)
    : destinations.data?.destinations;

  const lienDe = (destination: Destination) => {
    const suite = new URLSearchParams({ depuis: gare.uic });
    if (filtres.date !== null) suite.set('date', filtres.date);
    return `/destinations/${destination.gare.uic}?${suite.toString()}`;
  };

  const suivante = dureeElargie(filtres.dureeMax, parametres.durees.trainMaxOptionsMin);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-4">
      <CarteVotreGare
        nom={gare.nom}
        distanceM={gare.distanceM}
        dureeVeloMin={gare.dureeVeloMin}
        prochainDepart={liste ? prochainTrainDirect(liste) : null}
        surChangement={surChangementGare}
      />
      <SectionAPied
        titre={origine === 'position' ? 'À deux pas de vous' : 'À deux pas de la gare'}
        rayonLibelle={libelleRayon(filtres.rayon)}
        lieux={lieux.data?.lieux}
        chargement={lieux.isPending}
        erreur={lieux.isError}
        surReessai={() => void lieux.refetch()}
      />
      <SectionDestinations
        gareNom={gare.nom}
        destinations={liste}
        chargement={destinations.isPending}
        erreur={destinations.isError ? destinations.error.message : null}
        lienDe={lienDe}
        surReessai={() => void destinations.refetch()}
        surAujourdhui={
          destinations.error instanceof ErreurClient && destinations.error.statut === 400
            ? () => surModification({ date: null })
            : null
        }
        elargir={
          suivante === null
            ? null
            : {
                libelle: `Élargir à ${libelleDureeMax(suivante)} de train`,
                action: () => surModification({ dureeMax: suivante }),
              }
        }
        surEffacer={() =>
          surModification({
            categories: FILTRES_PAR_DEFAUT.categories,
            dureeMax: FILTRES_PAR_DEFAUT.dureeMax,
            faisable: FILTRES_PAR_DEFAUT.faisable,
          })
        }
      />
    </div>
  );
}
