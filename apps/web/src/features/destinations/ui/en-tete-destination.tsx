'use client';

import { CalendarDays, Check, ChevronDown, Clock, Moon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BarreRetour } from '@/components/ui/barre-retour';
import { Bouton } from '@/components/ui/bouton';
import { Puce } from '@/components/ui/puce';
import { useDateDuJour } from '@/lib/utiliser-date-du-jour';
import { joursDuWeekEnd, libelleDate } from '@/features/explorer/date';
import { formaterDuree } from '../presentation';
import type { FicheDestination } from '../schemas';

type Proprietes = {
  fiche: FicheDestination;
  date: string | null;
  surRetour: () => void;
  surOuvrirDate: () => void;
  surDate: (date: string) => void;
};

export function EnTeteDestination({ fiche, date, surRetour, surOuvrirDate, surDate }: Proprietes) {
  const { gare, liaison } = fiche;
  // Tenue à jour : une fiche restée ouverte après minuit passe de « Demain » à « Aujourd'hui » (D108).
  const aujourdhui = useDateDuJour();
  const weekEnd = joursDuWeekEnd(date, aujourdhui);

  return (
    <header className="flex flex-none flex-col gap-2">
      {/* Retour et date : la barre commune, même place que sur toutes les fiches (Hardy, 20/11). */}
      <BarreRetour
        surRetour={surRetour}
        droite={
          <Bouton
            variante="secondaire"
            className="rounded-pill border-border px-3 font-medium"
            onClick={surOuvrirDate}
          >
            <CalendarDays aria-hidden="true" className="size-4.5 text-primary" />
            {libelleDate(date, aujourdhui)}
            <ChevronDown aria-hidden="true" className="size-4 text-primary" />
          </Bouton>
        }
      />

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-tight font-bold">{gare.titre}</h1>
        {gare.horsVille && gare.commune.nom && (
          <p className="text-sm text-page-marque-texte-muted">
            Gare de {gare.nom}, à {gare.commune.nom}
          </p>
        )}
        {liaison && (
          <p className="tabular flex flex-wrap items-center gap-x-1.5 text-md text-page-marque-texte-muted">
            <Clock aria-hidden="true" className="size-4 text-page-marque-texte" />
            <strong className="font-semibold text-page-marque-texte">
              {formaterDuree(liaison.dureeMin)} direct
            </strong>
            · {liaison.nbTrains} {liaison.nbTrains > 1 ? 'trains' : 'train'}/jour
          </p>
        )}
        {liaison && (
          <Badge variante={liaison.faisableJournee ? 'eco' : 'neutre'} className="self-start">
            {liaison.faisableJournee ? <Check aria-hidden="true" /> : <Moon aria-hidden="true" />}
            {liaison.faisableJournee
              ? 'Faisable dans la journée'
              : 'Retour tôt, plutôt sur 2 jours'}
          </Badge>
        )}
      </div>

      {weekEnd && (
        <div role="group" aria-label="Jour du week-end" className="flex gap-2">
          <Puce selectionnee={date === weekEnd.samedi} onClick={() => surDate(weekEnd.samedi)}>
            Samedi
          </Puce>
          <Puce selectionnee={date === weekEnd.dimanche} onClick={() => surDate(weekEnd.dimanche)}>
            Dimanche
          </Puce>
        </div>
      )}
    </header>
  );
}
