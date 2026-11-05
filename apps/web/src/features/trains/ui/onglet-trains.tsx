'use client';

import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { Bouton } from '@/components/ui/bouton';
import { EtatVide } from '@/components/ui/etat-vide';
import { Squelette } from '@/components/ui/squelette';
import { formaterDuree } from '@/features/destinations/presentation';
import { cn } from '@/lib/classes';
import { useMaintenant } from '@/lib/dates/use-maintenant';
import { useTrains } from '../hooks';
import { formaterHeure, libelleTrain, lignesRetour, trainsAVenir } from '../presentation';
import type { Train } from '../schemas';

function LigneTrain({ train, dernier = false }: { train: Train; dernier?: boolean }) {
  return (
    <li
      className={cn(
        'flex flex-col gap-0.5 rounded-lg border bg-surface px-2.5 py-2',
        dernier ? 'border-primary bg-primary-soft' : 'border-transparent',
      )}
    >
      {dernier && <span className="text-2xs font-bold text-primary">Dernier retour</span>}
      <span className="tabular text-md font-semibold">
        {formaterHeure(train.depart)} → {formaterHeure(train.arrivee)}
      </span>
      <span className="tabular text-xs text-muted-foreground">
        {formaterDuree(train.dureeMin)} · {libelleTrain(train)}
      </span>
    </li>
  );
}

function Colonne({
  titre,
  sousTitre,
  children,
}: {
  titre: string;
  sousTitre: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={titre} className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-col">
        <h3 className="text-md font-bold">{titre}</h3>
        <span className="truncate text-xs text-muted-foreground">{sousTitre}</span>
      </div>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

type Proprietes = {
  /** Null : lien ouvert sans gare de départ. */
  depart: { uic: string; nom: string } | null;
  arrivee: { uic: string; nom: string };
  date: string | null;
  surDemain: () => void;
  surAutreDate: () => void;
};

export function OngletTrains({ depart, arrivee, date, surDemain, surAutreDate }: Proprietes) {
  if (depart === null) {
    return (
      <EtatVide
        titre="D'où partez-vous ?"
        texte="Choisissez une gare de départ dans Explorer pour voir les trains directs vers cette destination."
      />
    );
  }
  return (
    <Horaires
      depart={depart}
      arrivee={arrivee}
      date={date}
      surDemain={surDemain}
      surAutreDate={surAutreDate}
    />
  );
}

function Horaires({
  depart,
  arrivee,
  date,
  surDemain,
  surAutreDate,
}: Proprietes & { depart: { uic: string; nom: string } }) {
  const trains = useTrains(depart.uic, arrivee.uic, date);
  const maintenant = useMaintenant();

  if (trains.isPending) {
    return (
      <div aria-hidden="true" className="grid grid-cols-2 gap-2">
        <Squelette className="h-64 rounded-lg" />
        <Squelette className="h-64 rounded-lg" />
      </div>
    );
  }
  if (trains.isError) {
    return (
      <EtatVide titre="Les horaires n'ont pas pu être chargés" texte="Réessayez dans un instant.">
        <Bouton variante="secondaire" onClick={() => void trains.refetch()}>
          Réessayer
        </Bouton>
      </EtatVide>
    );
  }

  // Une autre date, choisie exprès, montre sa journée entière.
  const pourAujourdhui = date === null || date === maintenant.dateDuJour;
  const { aller, retour, dernierRetour } = pourAujourdhui
    ? trainsAVenir(trains.data, maintenant)
    : trains.data;
  if (aller.length === 0) {
    return pourAujourdhui ? (
      <EtatVide
        titre="Plus de train direct aujourd'hui"
        texte="Le dernier train direct de la journée est déjà parti."
      >
        <Bouton variante="secondaire" onClick={surDemain}>
          Voir demain
        </Bouton>
      </EtatVide>
    ) : (
      <EtatVide titre="Pas de train direct ce jour-là" texte="Essayez une autre date.">
        <Bouton variante="secondaire" onClick={surAutreDate}>
          Choisir une date
        </Bouton>
      </EtatVide>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p role="note" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info aria-hidden="true" className="size-3.5 flex-none" />
        Horaires prévus, à vérifier avant de partir.
      </p>
      <div className="grid grid-cols-2 items-start gap-2">
        <Colonne titre="Aller" sousTitre={`${depart.nom} → ${arrivee.nom}`}>
          {aller.map((train) => (
            <LigneTrain key={train.trajetIds[0]} train={train} />
          ))}
        </Colonne>
        <Colonne titre="Retour" sousTitre={`${arrivee.nom} → ${depart.nom}`}>
          {lignesRetour(retour, dernierRetour).map(({ train, dernier }) => (
            <LigneTrain key={train.trajetIds[0]} train={train} dernier={dernier} />
          ))}
        </Colonne>
      </div>
    </div>
  );
}
