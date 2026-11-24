'use client';

// La date dans la page « Trajet » (D116, maquette « Trajet », remarque ③ du professeur). Un seul état : la
// date de l'adresse de la page, la même que dans « Filtres » et sur la pastille de la carte. Ces
// composants la lisent et l'écrivent eux-mêmes (`useFiltres`), sans la recevoir de proche en proche.
import { dateDuJour as lireDateDuJour } from '@tourisme/commun';
import { detailCourtWeekEnd, optionsDate } from '../date';
import { useFenetreHoraires, useFiltres } from '../hooks';
import { Calendrier } from './calendrier';
import { ChoixDate } from './choix-date';

/**
 * « Aujourd'hui », « Demain », « Ce week-end », sous les champs, quand Destination est actif : la date change
 * les destinations proposées. Le toucher ne prend pas le focus : le curseur reste dans le champ (clavier ouvert).
 */
export function PastillesDateTrajet() {
  const { filtres, changer } = useFiltres();
  const aujourdhui = lireDateDuJour();
  const date = filtres.date === aujourdhui ? null : filtres.date;
  return (
    <div role="group" aria-label="Date de la sortie" className="grid grid-cols-3 gap-1.5">
      {optionsDate(aujourdhui).map((option) => (
        <ChoixDate
          key={option.cle}
          compacte
          selectionne={option.date === date}
          libelle={option.libelle}
          detail={
            option.cle === 'weekend' && option.date
              ? detailCourtWeekEnd(option.date)
              : option.detail
          }
          onPointerDown={(evenement) => evenement.preventDefault()}
          onClick={() => changer({ date: option.date })}
        />
      ))}
    </div>
  );
}

/** Zone du bas quand la ligne « Date » est touchée : le calendrier, borné aux horaires chargés. */
export function ZoneDateTrajet({ surChoisie }: { surChoisie: () => void }) {
  const { filtres, changer } = useFiltres();
  const fenetre = useFenetreHoraires();
  const aujourdhui = lireDateDuJour();
  return (
    <Calendrier
      dateDuJour={aujourdhui}
      fin={fenetre.data?.fin ?? null}
      depart={filtres.date === aujourdhui ? null : filtres.date}
      surChoix={(choix) => {
        changer({ date: choix });
        surChoisie();
      }}
    />
  );
}
