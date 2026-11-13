'use client';

import { dateDuJour } from '@tourisme/commun';
import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from 'react';
import { EnTete } from '@/components/ui/en-tete';
import { useGrandEcran } from '@/features/carte/hooks';
import { cn } from '@/lib/classes';
import { nombreFiltres } from '../filtres';
import { useListeDestinations } from '../liste-destinations';
import { dateChoisie, libelleDate } from '../date';
import { useChoixDepart, useFiltres } from '../hooks';
import { usePageTrajet } from '../use-page-trajet';
import type { PositionFeuille } from '../position-feuille';
import {
  BoutonDepart,
  ErreurChoixDepart,
  EtatsDepart,
  FeuilleChoixDepart,
} from './controles-depart';
import { FeuilleFiltres } from './feuille-filtres';
import { PageTrajet } from './page-trajet';
import { RangeeFiltres } from './rangee-filtres';
import { ResultatsExplorer } from './resultats-explorer';
import { TrajetExplorer } from './trajet-explorer';

export function EcranExplorer() {
  const choix = useChoixDepart();
  const { depart } = choix;
  const [positionFeuille, setPositionFeuille] = useState<PositionFeuille>('milieu');
  const [feuilleFiltres, setFeuilleFiltres] = useState(false);
  const [demandeDefilement, setDemandeDefilement] = useState(0);
  const { filtres, changer } = useFiltres();
  const aujourdhui = dateDuJour();

  const pret = depart.etat === 'pret';
  const grandEcran = useGrandEcran();
  const trajet = usePageTrajet();
  const montrerResultats = () => {
    setPositionFeuille('plein');
    setDemandeDefilement((n) => n + 1);
  };

  // Sur mobile, la carte passe sous l'en-tête : ses boutons et son cadrage doivent le contourner (D072).
  const enTete = useRef<HTMLElement>(null);
  const [hauteurEnTete, setHauteurEnTete] = useState(0);
  useEffect(() => {
    const element = enTete.current;
    if (!element) return;
    const observateur = new ResizeObserver(() => setHauteurEnTete(element.offsetHeight));
    observateur.observe(element);
    return () => observateur.disconnect();
  }, [pret]);

  return (
    <div
      data-feuille={positionFeuille}
      style={{ '--en-tete-hauteur': `${hauteurEnTete}px` } as CSSProperties}
      className={cn(
        'relative flex h-full flex-col',
        pret
          ? 'overflow-hidden lg:grid lg:grid-cols-[var(--panneau-largeur)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]'
          : 'overflow-y-auto',
      )}
    >
      {pret && (
        <div
          aria-hidden="true"
          className="degrade-statut pointer-events-none absolute inset-x-0 top-0 z-header lg:hidden"
        />
      )}
      <EnTete
        ref={enTete}
        flottant={pret}
        className={cn('mt-1 flex-none', pret && 'lg:col-start-1 lg:row-start-1 lg:border-b')}
      >
        {depart.etat === 'pret' ? (
          <TrajetExplorer
            choix={choix}
            depart={depart}
            filtres={filtres}
            surModification={changer}
            surResultats={montrerResultats}
            ouvrirPage={grandEcran ? null : trajet.ouvrir}
          />
        ) : (
          <BoutonDepart choix={choix} />
        )}
        {pret && (
          <RangeeFiltres
            categories={filtres.categories}
            surCategories={(categories) => changer({ categories })}
            nombre={nombreFiltres(filtres, aujourdhui)}
            date={
              dateChoisie(filtres.date, aujourdhui) ? libelleDate(filtres.date, aujourdhui) : null
            }
            surAujourdhui={() => changer({ date: null })}
            surFiltres={() => setFeuilleFiltres(true)}
          />
        )}
        <ErreurChoixDepart choix={choix} />
      </EnTete>

      <EtatsDepart choix={choix} />

      {depart.etat === 'pret' && (
        <ResultatsExplorer
          depart={depart}
          filtres={filtres}
          surModification={changer}
          surChangementGare={() =>
            grandEcran ? choix.setFeuilleOuverte(true) : trajet.ouvrir('depart')
          }
          surChoixGare={choix.choisirGareEtFermer}
          position={positionFeuille}
          surPosition={setPositionFeuille}
          masqueEnHaut={() => (grandEcran ? 0 : hauteurEnTete)}
          demandeDefilement={demandeDefilement}
        />
      )}

      {depart.etat === 'pret' ? (
        <FiltresAvecDestination
          gareUic={depart.gare.uic}
          ouverte={feuilleFiltres}
          surChangement={setFeuilleFiltres}
          filtres={filtres}
          surModification={changer}
        />
      ) : (
        <FeuilleFiltres
          ouverte={feuilleFiltres}
          surChangement={setFeuilleFiltres}
          filtres={filtres}
          surModification={changer}
        />
      )}
      <FeuilleChoixDepart choix={choix} />
      <PageTrajet
        trajet={trajet}
        choix={choix}
        filtres={filtres}
        surModification={changer}
        surResultats={montrerResultats}
      />
    </div>
  );
}

/**
 * « Filtres » avec la destination choisie, lue dans la liste déjà chargée (même requête que les
 * résultats : aucune demande de plus). Seulement quand le départ est connu.
 */
function FiltresAvecDestination({
  gareUic,
  ...proprietes
}: { gareUic: string } & Omit<ComponentProps<typeof FeuilleFiltres>, 'destination'>) {
  const { requete } = useListeDestinations(gareUic, proprietes.filtres);
  const uic = proprietes.filtres.destination;
  const destination =
    uic === null ? null : (requete.data?.destinations.find((d) => d.gare.uic === uic) ?? null);
  return <FeuilleFiltres {...proprietes} destination={destination} />;
}
