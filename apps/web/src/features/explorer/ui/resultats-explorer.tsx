'use client';

import { dateDuJour } from '@tourisme/commun';
import { useRef, useState } from 'react';
import { parametres } from '@/config/parametres';
import { AttributionFondCarte } from '@/features/carte/ui/attribution-fond-carte';
import { dureeElargie, prochainTrainDirect } from '@/features/destinations/presentation';
import { SectionDestinations } from '@/features/destinations/ui/section-destinations';
import type { Destination } from '@/features/destinations/schemas';
import { CarteExplorerDifferee } from '@/features/carte/ui/carte-explorer-differee';
import { CarteVotreGare } from '@/features/gares/ui/carte-votre-gare';
import { useLieuxAutour } from '@/features/lieux/hooks';
import { SectionAPied } from '@/features/lieux/ui/section-a-pied';
import { ErreurClient } from '@/lib/http/client';
import { suffixeDate } from '../date';
import { plusProcheDifferente, type Depart } from '../depart';
import type { PositionFeuille } from '../position-feuille';
import { FeuilleResultats } from './feuille-resultats';
import { FILTRES_PAR_DEFAUT, libelleDureeMax, libelleRayon, type Filtres } from '../filtres';
import { TEXTES_TRAJET } from '../contenu-trajet';
import { useDefilementVersDestination } from '../defilement-destination';
import { useListeDestinations } from '../liste-destinations';

const AUCUNE_DESTINATION: readonly Destination[] = [];

type Proprietes = {
  depart: Extract<Depart, { etat: 'pret' }>;
  filtres: Filtres;
  surModification: (modifications: Partial<Filtres>) => void;
  surChangementGare: () => void;
  surChoixGare: (uic: string) => void;
  position: PositionFeuille;
  surPosition: (position: PositionFeuille) => void;
  /** Hauteur de l'en-tête posé sur la carte, pour ne rien cadrer dessous. */
  masqueEnHaut: () => number;
  /** Augmente à chaque recherche appliquée : la feuille défile jusqu'à la première destination (D084). */
  demandeDefilement: number;
};

/** « Votre gare », « À deux pas de vous », « En train direct » : tout suit les filtres de l'URL. */
export function ResultatsExplorer({
  depart,
  filtres,
  surModification,
  surChangementGare,
  surChoixGare,
  position,
  surPosition,
  masqueEnHaut,
  demandeDefilement,
}: Proprietes) {
  const feuille = useRef<HTMLDivElement>(null);
  const [survolee, setSurvolee] = useState<string | null>(null);
  const [carteTouchee, setCarteTouchee] = useState(0);
  const { gare, point, origine } = depart;
  const plusProche = plusProcheDifferente(depart);
  const lieux = useLieuxAutour({ point, rayon: filtres.rayon, categories: filtres.categories });
  // Liste partagée avec la feuille « Où allez-vous ? » ; `liste` suit aussi la recherche (D084).
  const { requete: destinations, avantRecherche, liste } = useListeDestinations(gare.uic, filtres);
  const rechercheActive = filtres.recherche !== '';
  useDefilementVersDestination(feuille, demandeDefilement, rechercheActive, liste);

  const lienDe = (destination: Destination) => {
    const suite = new URLSearchParams({ depuis: gare.uic });
    if (filtres.date !== null) suite.set('date', filtres.date);
    return `/destinations/${destination.gare.uic}?${suite.toString()}`;
  };

  const suivante = dureeElargie(filtres.dureeMax, parametres.durees.trainMaxOptionsMin);

  return (
    <div className="min-h-0 flex-1 lg:contents">
      {/* Relative à l'écran entier sur mobile : la carte passe sous l'en-tête (D072). */}
      <div className="absolute inset-0 lg:relative lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <CarteExplorerDifferee
          key={gare.uic}
          utilisateur={origine === 'position' ? point : null}
          gareDepart={{ uic: gare.uic, lat: gare.lat, lon: gare.lon, nom: gare.nom }}
          date={filtres.date}
          destinations={liste ?? AUCUNE_DESTINATION}
          destinationCherchee={filtres.destination}
          carteTouchee={carteTouchee}
          lieux={lieux.data?.lieux ?? []}
          lienDe={lienDe}
          masqueEnHaut={masqueEnHaut}
          masqueEnBas={() => {
            const element = feuille.current;
            return element && getComputedStyle(element).position === 'absolute'
              ? element.offsetHeight
              : 0;
          }}
          pleinEcran={{
            actif: position === 'carte',
            bascule: () => surPosition(position === 'carte' ? 'milieu' : 'carte'),
          }}
          survolee={survolee}
          surSurvol={setSurvolee}
        />
      </div>
      {/* Transparente au toucher : seule la feuille réagit, la carte reste utilisable autour. */}
      <div className="pointer-events-none relative h-full lg:contents">
        {/* Attribution exigée par la licence, posée sur la feuille (config/sources.json). */}
        <p className="absolute inset-x-0 top-(--resultats-haut) z-sheet -translate-y-full bg-surface/80 px-2 py-0.5 text-2xs text-muted-foreground lg:hidden">
          <AttributionFondCarte />
        </p>
        <FeuilleResultats ref={feuille} position={position} surPosition={surPosition}>
          <div className="flex flex-col gap-6 px-4 pb-6 lg:pt-4">
            <CarteVotreGare
              nom={gare.nom}
              distanceM={gare.distanceM}
              dureeMarcheMin={gare.dureeMarcheMin}
              dureeVeloMin={gare.dureeVeloMin}
              prochainDepart={avantRecherche ? prochainTrainDirect(avantRecherche) : null}
              surChangement={surChangementGare}
              plusProche={
                plusProche && {
                  nom: plusProche.nom,
                  dureeMarcheMin: plusProche.dureeMarcheMin,
                  surChoix: () => surChoixGare(plusProche.uic),
                }
              }
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
              suffixeDate={suffixeDate(filtres.date, dateDuJour())}
              destinations={liste}
              chargement={destinations.isPending}
              erreur={destinations.isError ? destinations.error.message : null}
              lienDe={lienDe}
              survolee={survolee}
              surSurvol={(uic) => {
                setSurvolee(uic);
                if (uic !== null) setCarteTouchee((nombre) => nombre + 1);
              }}
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
              recherche={
                rechercheActive && avantRecherche
                  ? {
                      compte: TEXTES_TRAJET.compte(liste?.length ?? 0, avantRecherche.length),
                      titreVide: TEXTES_TRAJET.aucune(filtres.recherche),
                      texteVide: TEXTES_TRAJET.aucuneTexte,
                      libelleEffacer: TEXTES_TRAJET.effacer,
                      surEffacer: () => surModification({ recherche: '', destination: null }),
                    }
                  : null
              }
            />
          </div>
        </FeuilleResultats>
      </div>
    </div>
  );
}
