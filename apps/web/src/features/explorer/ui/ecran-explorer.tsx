'use client';

import { useQueryClient } from '@tanstack/react-query';
import { dateDuJour } from '@tourisme/commun';
import { CalendarDays, ChevronDown, MapPin } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/classes';
import { Bandeau } from '@/components/ui/bandeau';
import { Bouton } from '@/components/ui/bouton';
import { EnTete } from '@/components/ui/en-tete';
import { EtatVide } from '@/components/ui/etat-vide';
import { Squelette } from '@/components/ui/squelette';
import { gareLaPlusProche } from '@/features/gares/hooks';
import { useCommune } from '@/features/localisation/hooks';
import { EcranHorsRegion } from '@/features/localisation/ui/ecran-hors-region';
import { EcranSansPosition } from '@/features/localisation/ui/ecran-sans-position';
import { FeuilleDepart } from '@/features/localisation/ui/feuille-depart';
import { libelleDate } from '../date';
import { nombreFiltres } from '../filtres';
import { useDepart, useFiltres } from '../hooks';
import type { PositionFeuille } from '../position-feuille';
import { FeuilleDate } from './feuille-date';
import { FeuilleFiltres } from './feuille-filtres';
import { RangeeFiltres } from './rangee-filtres';
import { ResultatsExplorer } from './resultats-explorer';

export function EcranExplorer() {
  const { depart, point, essais, choisirGare, revenirAMaPosition } = useDepart();
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const [positionFeuille, setPositionFeuille] = useState<PositionFeuille>('milieu');
  const [feuilleDate, setFeuilleDate] = useState(false);
  const [feuilleFiltres, setFeuilleFiltres] = useState(false);
  const [erreurChoix, setErreurChoix] = useState(false);
  const { filtres, changer } = useFiltres();
  const client = useQueryClient();
  const commune = useCommune(point);

  const choisirGareEtFermer = (uic: string) => {
    setFeuilleOuverte(false);
    setErreurChoix(false);
    choisirGare(uic);
  };
  const choisirPoint = async ({ lat, lon }: { lat: number; lon: number }) => {
    const gare = await gareLaPlusProche(client, lat, lon).catch(() => null);
    if (gare) choisirGareEtFermer(gare.uic);
    else setErreurChoix(true);
  };

  const libelle =
    depart.etat === 'pret' && depart.origine === 'choix'
      ? `Au départ de ${depart.gare.nom}`
      : depart.etat === 'pret'
        ? `Autour de ${commune.data?.commune ?? 'vous'}`
        : 'Choisir une ville';

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
        action={
          depart.etat === 'pret' && (
            <Bouton
              variante="secondaire"
              className="rounded-pill border-border px-3 font-medium"
              onClick={() => setFeuilleDate(true)}
            >
              <CalendarDays aria-hidden="true" className="size-4.5 text-primary" />
              {libelleDate(filtres.date, dateDuJour())}
              <ChevronDown aria-hidden="true" className="size-4 text-primary" />
            </Bouton>
          )
        }
      >
        <Bouton
          variante="secondaire"
          className="w-full justify-start border-0 bg-surface text-base font-normal shadow-xs"
          onClick={() => setFeuilleOuverte(true)}
        >
          <MapPin aria-hidden="true" className="size-4.5 flex-none text-primary" />
          <span className="min-w-0 flex-1 truncate text-left">{libelle}</span>
          <ChevronDown aria-hidden="true" className="size-4 flex-none text-primary" />
        </Bouton>
        {depart.etat === 'pret' && (
          <RangeeFiltres
            categories={filtres.categories}
            surCategories={(categories) => changer({ categories })}
            nombre={nombreFiltres(filtres)}
            surFiltres={() => setFeuilleFiltres(true)}
          />
        )}
        {erreurChoix && (
          <Bandeau variante="danger">
            Aucune gare trouvée pour ce choix. Essayez une autre ville.
          </Bandeau>
        )}
      </EnTete>

      {depart.etat === 'chargement' && (
        <div className="flex flex-col gap-3 p-4">
          <Bandeau variante="neutre">On cherche ce qu&apos;il y a autour de vous…</Bandeau>
          <Squelette className="h-36 rounded-carte" />
        </div>
      )}

      {depart.etat === 'sans_position' && (
        <EcranSansPosition
          raison={depart.raison}
          bloquee={depart.raison === 'refusee' && essais > 0}
          surChoixPoint={choisirPoint}
          surChoixGare={choisirGareEtFermer}
          surRedemande={revenirAMaPosition}
        />
      )}

      {depart.etat === 'hors_region' && (
        <EcranHorsRegion
          surChoixGare={choisirGareEtFermer}
          surRecherche={() => setFeuilleOuverte(true)}
        />
      )}

      {depart.etat === 'erreur' && (
        <div className="p-4">
          <EtatVide
            titre="Un problème est survenu"
            texte="Nous n'avons pas pu trouver votre gare. Réessayez dans un instant."
          >
            <Bouton variante="secondaire" onClick={revenirAMaPosition}>
              Réessayer
            </Bouton>
          </EtatVide>
        </div>
      )}

      {depart.etat === 'pret' && (
        <ResultatsExplorer
          depart={depart}
          filtres={filtres}
          surModification={changer}
          surChangementGare={() => setFeuilleOuverte(true)}
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
      <FeuilleDepart
        ouverte={feuilleOuverte}
        surChangement={setFeuilleOuverte}
        proches={depart.etat === 'pret' ? depart.proches : []}
        uicActuel={depart.etat === 'pret' ? depart.gare.uic : null}
        surMaPosition={() => {
          setFeuilleOuverte(false);
          revenirAMaPosition();
        }}
        surChoixGare={choisirGareEtFermer}
        surChoixPoint={choisirPoint}
      />
    </div>
  );
}
