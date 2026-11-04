'use client';

import { dateDuJour as lireDateDuJour } from '@tourisme/commun';
import { ArrowLeft, CalendarDays, Check } from 'lucide-react';
import { useState } from 'react';
import { Bouton } from '@/components/ui/bouton';
import { Feuille } from '@/components/ui/feuille';
import { libelleCourt } from '@/lib/dates/calendrier';
import { optionsDate } from '../date';
import { useFenetreHoraires } from '../hooks';
import { Calendrier } from './calendrier';

type Proprietes = {
  ouverte: boolean;
  surChangement: (ouverte: boolean) => void;
  date: string | null;
  surChoix: (date: string | null) => void;
};

const CLASSES_LIGNE =
  'flex min-h-14 w-full cursor-pointer items-center gap-3 border-b px-1 text-left last:border-b-0 hover:bg-surface-sunken';

/** « Quand ? » : aujourd'hui, demain, ce week-end, ou une date du calendrier. */
export function FeuilleDate({ ouverte, surChangement, date, surChoix }: Proprietes) {
  const [calendrier, setCalendrier] = useState(false);
  const fenetre = useFenetreHoraires();
  const aujourdhui = lireDateDuJour();
  const options = optionsDate(aujourdhui);
  const estOption = date === null || options.some((o) => o.date === date);

  const fermer = () => {
    surChangement(false);
    setCalendrier(false);
  };
  const choisir = (choix: string | null) => {
    surChoix(choix);
    fermer();
  };

  return (
    <Feuille
      ouverte={ouverte}
      surChangement={(valeur) => (valeur ? surChangement(true) : fermer())}
      titre={calendrier ? 'Choisir une date' : 'Quand ?'}
    >
      {calendrier ? (
        <div className="flex flex-col gap-3">
          <Bouton
            variante="fantome"
            className="-ml-3 self-start text-primary"
            onClick={() => setCalendrier(false)}
          >
            <ArrowLeft aria-hidden="true" className="size-4.5" />
            Retour
          </Bouton>
          <Calendrier
            dateDuJour={aujourdhui}
            fin={fenetre.data?.fin ?? null}
            depart={date}
            surChoix={choisir}
          />
        </div>
      ) : (
        <ul>
          {options.map((option) => (
            <li key={option.cle}>
              <button
                type="button"
                aria-current={option.date === date ? 'true' : undefined}
                onClick={() => choisir(option.date)}
                className={CLASSES_LIGNE}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-base font-semibold">{option.libelle}</span>
                  <span className="tabular text-sm text-muted-foreground">{option.detail}</span>
                </span>
                {option.date === date && (
                  <Check aria-hidden="true" className="size-5 flex-none text-primary" />
                )}
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => setCalendrier(true)} className={CLASSES_LIGNE}>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-base font-semibold">Choisir une date</span>
                <span className="tabular text-sm text-muted-foreground">
                  {!estOption && date !== null ? libelleCourt(date) : 'Calendrier'}
                </span>
              </span>
              {!estOption ? (
                <Check aria-hidden="true" className="size-5 flex-none text-primary" />
              ) : (
                <CalendarDays aria-hidden="true" className="size-5 flex-none text-primary" />
              )}
            </button>
          </li>
        </ul>
      )}
    </Feuille>
  );
}
