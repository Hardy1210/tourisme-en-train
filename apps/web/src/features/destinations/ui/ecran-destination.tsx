'use client';

import { dateDuJour } from '@tourisme/commun';
import { useState } from 'react';
import { Bouton, BoutonRetour } from '@/components/ui/bouton';
import { CadreFiche } from '@/components/ui/cadre-fiche';
import { EtatVide } from '@/components/ui/etat-vide';
import { Onglets } from '@/components/ui/onglets';
import { Squelette } from '@/components/ui/squelette';
import { useGrandEcran } from '@/features/carte/hooks';
import { CarteLieuxDifferee } from '@/features/carte/ui/carte-lieux-differee';
import { useGare } from '@/features/gares/hooks';
import { FeuilleDate } from '@/features/explorer/ui/feuille-date';
import { FeuilleComparer } from '@/features/impact/ui/feuille-comparer';
import { useLieuxGare } from '@/features/lieux/hooks';
import { lienLieu } from '@/features/lieux/liens';
import { OngletLieux } from '@/features/lieux/ui/onglet-lieux';
import { OngletSurPlace } from '@/features/mobilites/ui/onglet-sur-place';
import { OngletTrains } from '@/features/trains/ui/onglet-trains';
import { decalerJours } from '@/lib/dates/calendrier';
import { ErreurClient } from '@/lib/http/client';
import { useRetour } from '@/lib/utiliser-retour';
import { useFicheDestination } from '../hooks';
import { useParametresFiche } from '../parametres-fiche';
import { EnTeteDestination } from './en-tete-destination';
import { PiedDestination } from './pied-destination';

export function EcranDestination({ uic }: { uic: string }) {
  const { depuis, date, onglet, changer } = useParametresFiche();
  const fiche = useFicheDestination(uic, depuis, date);
  const gareDepart = useGare(depuis);
  const lieuxCharges = fiche.data?.lieuxCharges ?? false;
  const lieux = useLieuxGare(uic, lieuxCharges);
  const [feuilleDate, setFeuilleDate] = useState(false);
  const [comparer, setComparer] = useState(false);
  const [cleChoisie, setCleChoisie] = useState<string | null>(null);
  const grandEcran = useGrandEcran();
  const surRetour = useRetour();

  if (fiche.isPending) {
    return (
      <CadreFiche carte={<div aria-hidden="true" className="h-full bg-map-land" />}>
        <div aria-hidden="true" className="flex flex-col gap-3 p-4">
          <Squelette className="h-32 rounded-lg" />
          <Squelette className="h-64 rounded-lg" />
        </div>
      </CadreFiche>
    );
  }

  if (fiche.isError) {
    const { error } = fiche;
    const statut = error instanceof ErreurClient ? error.statut : 500;
    return (
      <CadreFiche carte={null}>
        <div className="flex flex-col gap-3 p-4">
          <BoutonRetour className="-ml-2" onClick={surRetour} />
          {statut === 404 ? (
            <EtatVide
              titre="Cette destination n'existe pas ou plus"
              texte="Retrouvez toutes les sorties possibles depuis l'écran Explorer."
            />
          ) : statut === 400 ? (
            <EtatVide titre="Cette date n'est pas disponible" texte={error.message}>
              <Bouton variante="secondaire" onClick={() => changer({ date: null })}>
                Revenir à aujourd&apos;hui
              </Bouton>
            </EtatVide>
          ) : (
            <EtatVide titre="Un problème est survenu" texte="Réessayez dans un instant.">
              <Bouton variante="secondaire" onClick={() => void fiche.refetch()}>
                Réessayer
              </Bouton>
            </EtatVide>
          )}
        </div>
      </CadreFiche>
    );
  }

  const { gare, liaison } = fiche.data;
  const lienDe = (cle: string) => lienLieu(cle, depuis ? { depuis, date } : undefined);
  const carte = (
    <CarteLieuxDifferee
      gare={{ lat: gare.lat, lon: gare.lon, nom: gare.nom }}
      lieux={lieux.data?.lieux ?? []}
      cleChoisie={cleChoisie}
      surChoix={setCleChoisie}
      lienDe={lienDe}
    />
  );
  const versTrains = () => changer({ onglet: 'trains' });

  return (
    <CadreFiche carte={grandEcran ? carte : null}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-1">
        <EnTeteDestination
          fiche={fiche.data}
          date={date}
          surRetour={surRetour}
          surOuvrirDate={() => setFeuilleDate(true)}
          surDate={(choix) => changer({ date: choix })}
        />
        <Onglets
          className="min-h-0 flex-1"
          classeContenu="min-h-0 flex-1 overflow-y-auto pb-4"
          valeur={onglet}
          surChangement={(valeur) => changer({ onglet: valeur })}
          onglets={[
            {
              valeur: 'lieux',
              libelle: 'Lieux',
              contenu: (
                <OngletLieux
                  lieuxCharges={lieuxCharges}
                  lieux={lieux.data?.lieux}
                  chargement={lieux.isPending}
                  erreur={lieux.isError}
                  surReessai={() => void lieux.refetch()}
                  surTrains={versTrains}
                  lienDe={lienDe}
                  surCarte={setCleChoisie}
                  carte={grandEcran ? null : carte}
                />
              ),
            },
            {
              valeur: 'trains',
              libelle: 'Trains',
              contenu: (
                <OngletTrains
                  depart={
                    gareDepart.data ? { uic: gareDepart.data.uic, nom: gareDepart.data.nom } : null
                  }
                  arrivee={{ uic: gare.uic, nom: gare.titre }}
                  date={date}
                  surDemain={() => changer({ date: decalerJours(dateDuJour(), 1) })}
                  surAutreDate={() => setFeuilleDate(true)}
                />
              ),
            },
            {
              valeur: 'sur-place',
              libelle: 'Sur place',
              contenu: (
                <OngletSurPlace
                  uic={gare.uic}
                  gareNom={gare.nom}
                  dansRegion={gare.dansRegion}
                  surTrains={versTrains}
                />
              ),
            },
          ]}
        />
      </div>

      <PiedDestination
        co2EconomiseKg={liaison?.co2EconomiseKg ?? null}
        prixEstime={liaison?.prixEstime ?? null}
        surComparer={() => setComparer(true)}
      />

      <FeuilleDate
        ouverte={feuilleDate}
        surChangement={setFeuilleDate}
        date={date}
        surChoix={(choix) => changer({ date: choix })}
      />
      {depuis && (
        <FeuilleComparer
          ouverte={comparer}
          surChangement={setComparer}
          depart={depuis}
          arrivee={gare.uic}
        />
      )}
    </CadreFiche>
  );
}
