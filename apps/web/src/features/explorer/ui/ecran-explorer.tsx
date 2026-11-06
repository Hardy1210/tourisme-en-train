'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { EnTete } from '@/components/ui/en-tete';
import { useGrandEcran } from '@/features/carte/hooks';
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
  const grandEcran = useGrandEcran();

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
          masqueEnHaut={() => (grandEcran ? 0 : hauteurEnTete)}
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
