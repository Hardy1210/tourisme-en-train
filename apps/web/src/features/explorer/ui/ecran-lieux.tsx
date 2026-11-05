'use client';

import { useState } from 'react';
import { EnTete } from '@/components/ui/en-tete';
import { ListeLieuxAccessibles } from '@/features/lieux/ui/liste-lieux-accessibles';
import { FILTRES_PAR_DEFAUT, nombreFiltresLieux } from '../filtres';
import { useChoixDepart, useFiltres } from '../hooks';
import {
  BoutonDate,
  BoutonDepart,
  ErreurChoixDepart,
  EtatsDepart,
  FeuilleChoixDepart,
} from './controles-depart';
import { FeuilleDate } from './feuille-date';
import { FeuilleFiltres } from './feuille-filtres';
import { RangeeFiltres } from './rangee-filtres';

/** Onglet Lieux (D056) : où aller à pied depuis une gare, en train direct depuis la sienne. */
export function EcranLieux() {
  const choix = useChoixDepart();
  const { depart } = choix;
  const [feuilleDate, setFeuilleDate] = useState(false);
  const [feuilleFiltres, setFeuilleFiltres] = useState(false);
  const { filtres, changer } = useFiltres();
  const pret = depart.etat === 'pret';

  return (
    <div className="flex min-h-full flex-col bg-hero-bg">
      <EnTete
        surHero
        action={pret && <BoutonDate date={filtres.date} surClic={() => setFeuilleDate(true)} />}
      >
        <BoutonDepart choix={choix} />
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
        <div className="flex-1 bg-background">
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
    </div>
  );
}
