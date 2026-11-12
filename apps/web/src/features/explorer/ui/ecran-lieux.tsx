'use client';

import { useState } from 'react';
import { EnTete } from '@/components/ui/en-tete';
import { useGrandEcran } from '@/features/carte/hooks';
import { ListeLieuxAccessibles } from '@/features/lieux/ui/liste-lieux-accessibles';
import { FILTRES_PAR_DEFAUT, nombreFiltresLieux } from '../filtres';
import { useChoixDepart, useFiltres } from '../hooks';
import { usePageTrajet } from '../use-page-trajet';
import {
  BoutonDate,
  BoutonDepart,
  ErreurChoixDepart,
  EtatsDepart,
  FeuilleChoixDepart,
} from './controles-depart';
import { FeuilleDate } from './feuille-date';
import { FeuilleFiltres } from './feuille-filtres';
import { PageDepart } from './page-depart';
import { RangeeFiltres } from './rangee-filtres';

/** Onglet Lieux (D056) : où aller à pied depuis une gare, en train direct depuis la sienne. */
export function EcranLieux() {
  const choix = useChoixDepart();
  const { depart } = choix;
  const [feuilleDate, setFeuilleDate] = useState(false);
  const [feuilleFiltres, setFeuilleFiltres] = useState(false);
  const { filtres, changer } = useFiltres();
  const pret = depart.etat === 'pret';
  const grandEcran = useGrandEcran();
  // Sur téléphone, le départ se choisit dans une page plein écran, comme dans Explorer (D085).
  const trajet = usePageTrajet();

  return (
    <div className="flex min-h-full flex-col bg-hero-bg lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[var(--panneau-largeur)_minmax(0,1fr)] lg:overflow-hidden">
      <EnTete
        surHero={!grandEcran}
        className="lg:h-full lg:overflow-y-auto lg:border-r"
        action={pret && <BoutonDate date={filtres.date} surClic={() => setFeuilleDate(true)} />}
      >
        <BoutonDepart
          choix={choix}
          surClic={grandEcran ? undefined : () => trajet.ouvrir('depart')}
        />
        {pret && (
          <RangeeFiltres
            categories={filtres.categories}
            surCategories={(categories) => changer({ categories })}
            nombre={nombreFiltresLieux(filtres)}
            surFiltres={() => setFeuilleFiltres(true)}
          />
        )}
        <ErreurChoixDepart choix={choix} />
      </EnTete>

      {depart.etat === 'pret' ? (
        <ListeLieuxAccessibles
          gare={depart.gare}
          date={filtres.date}
          categories={filtres.categories}
          dureeMax={filtres.dureeMax}
          surAujourdhui={() => changer({ date: null })}
          surToutAfficher={() =>
            changer({
              categories: FILTRES_PAR_DEFAUT.categories,
              dureeMax: FILTRES_PAR_DEFAUT.dureeMax,
            })
          }
        />
      ) : (
        <div className="flex-1 overflow-y-auto bg-background">
          <EtatsDepart choix={choix} />
        </div>
      )}

      <FeuilleDate
        ouverte={feuilleDate}
        surChangement={setFeuilleDate}
        date={filtres.date}
        surChoix={(date) => changer({ date })}
      />
      <FeuilleFiltres
        ouverte={feuilleFiltres}
        surChangement={setFeuilleFiltres}
        filtres={filtres}
        surModification={changer}
        dureeSeulement
      />
      <FeuilleChoixDepart choix={choix} />
      <PageDepart trajet={trajet} choix={choix} />
    </div>
  );
}
