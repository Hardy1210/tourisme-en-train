'use client';

import { useState } from 'react';
import { EnTete } from '@/components/ui/en-tete';
import { cn } from '@/lib/classes';
import { nombreFiltres } from '../filtres';
import { useChoixDepart, useFiltres } from '../hooks';
import type { PositionFeuille } from '../position-feuille';
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
import { ResultatsExplorer } from './resultats-explorer';

export function EcranExplorer() {
  const choix = useChoixDepart();
  const { depart } = choix;
  const [positionFeuille, setPositionFeuille] = useState<PositionFeuille>('milieu');
  const [feuilleDate, setFeuilleDate] = useState(false);
  const [feuilleFiltres, setFeuilleFiltres] = useState(false);
  const { filtres, changer } = useFiltres();

  const pret = depart.etat === 'pret';

  return (
    <div
      data-feuille={positionFeuille}
      className={cn(
        'flex h-full flex-col',
        pret
          ? 'overflow-hidden lg:grid lg:grid-cols-[var(--panneau-largeur)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]'
          : 'overflow-y-auto',
      )}
    >
      <EnTete
        className={cn('flex-none', pret && 'lg:col-start-1 lg:row-start-1 lg:border-b')}
        action={pret && <BoutonDate date={filtres.date} surClic={() => setFeuilleDate(true)} />}
      >
        <BoutonDepart choix={choix} />
        {pret && (
          <RangeeFiltres
            categories={filtres.categories}
            surCategories={(categories) => changer({ categories })}
            nombre={nombreFiltres(filtres)}
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
          surChangementGare={() => choix.setFeuilleOuverte(true)}
          surChoixGare={choix.choisirGareEtFermer}
          position={positionFeuille}
          surPosition={setPositionFeuille}
        />
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
      />
      <FeuilleChoixDepart choix={choix} />
    </div>
  );
}
