'use client';

import { dateDuJour } from '@tourisme/commun';
import { CalendarDays, Check, ChevronDown, Clock, Moon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Bouton, BoutonRetour } from '@/components/ui/bouton';
import { Puce } from '@/components/ui/puce';
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
  const aujourdhui = dateDuJour();
  const weekEnd = joursDuWeekEnd(date, aujourdhui);

  return (
    <header className="flex flex-none flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <BoutonRetour className="-ml-2" onClick={surRetour} />
        <Bouton
          variante="secondaire"
          className="rounded-pill border-border px-3 font-medium"
          onClick={surOuvrirDate}
        >
          <CalendarDays aria-hidden="true" className="size-4.5 text-primary" />
          {libelleDate(date, aujourdhui)}
          <ChevronDown aria-hidden="true" className="size-4 text-primary" />
        </Bouton>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-tight font-bold">{gare.titre}</h1>
        {gare.horsVille && gare.commune.nom && (
          <p className="text-sm text-muted-foreground">
            Gare de {gare.nom}, à {gare.commune.nom}
          </p>
        )}
        {liaison && (
          <p className="tabular flex flex-wrap items-center gap-x-1.5 text-md text-muted-foreground">
            <Clock aria-hidden="true" className="size-4 text-primary" />
            <strong className="font-semibold text-foreground">
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
