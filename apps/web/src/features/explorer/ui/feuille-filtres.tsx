'use client';

import { dateDuJour as lireDateDuJour } from '@tourisme/commun';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bouton } from '@/components/ui/bouton';
import { Feuille } from '@/components/ui/feuille';
import { Interrupteur } from '@/components/ui/interrupteur';
import { Selecteur } from '@/components/ui/selecteur';
import { parametres } from '@/config/parametres';
import { cn } from '@/lib/classes';
import { libelleCourt } from '@/lib/dates/calendrier';
import { optionsDate } from '../date';
import { FILTRES_PAR_DEFAUT, libelleDureeMax, libelleRayon, type Filtres } from '../filtres';
import { useFenetreHoraires } from '../hooks';
import { Calendrier } from './calendrier';

const OPTIONS_RAYON = parametres.rayons.autourDeMoiOptionsM.map((metres) => ({
  valeur: String(metres),
  libelle: libelleRayon(metres),
}));
const OPTIONS_DUREE = parametres.durees.trainMaxOptionsMin.map((minutes) => ({
  valeur: String(minutes),
  libelle: libelleDureeMax(minutes),
}));

type Proprietes = {
  ouverte: boolean;
  surChangement: (ouverte: boolean) => void;
  filtres: Filtres;
  surModification: (modifications: Partial<Filtres>) => void;
  /** Écran Lieux : sa route ne connaît que la date et la durée de train. */
  dureeSeulement?: boolean;
};

/**
 * « Quand ? », rayon, durée de train et faisabilité : chaque choix s'applique tout de suite. « Choisir une
 * date » montre le calendrier dans la même feuille ; « Retour » ou une date choisie revient aux filtres.
 */
export function FeuilleFiltres({
  ouverte,
  surChangement,
  filtres,
  surModification,
  dureeSeulement = false,
}: Proprietes) {
  const [calendrier, setCalendrier] = useState(false);
  const fenetre = useFenetreHoraires();
  const aujourdhui = lireDateDuJour();
  const options = optionsDate(aujourdhui);
  const date = filtres.date === aujourdhui ? null : filtres.date;
  // Destination choisie : « Près de la gare de… » suit le périmètre fixe des gares, pas ce filtre.
  const noteDistance =
    filtres.destination === null
      ? null
      : `Autour de la gare de ${filtres.recherche} : ${libelleRayon(parametres.rayons.lieuxGareM)} à pied`;
  const dateDuCalendrier = date !== null && !options.some((o) => o.date === date);

  const changerOuverture = (valeur: boolean) => {
    surChangement(valeur);
    if (!valeur) setCalendrier(false);
  };

  return (
    <Feuille
      ouverte={ouverte}
      surChangement={changerOuverture}
      titre={calendrier ? 'Choisir une date' : 'Filtres'}
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
            surChoix={(choix) => {
              surModification({ date: choix });
              setCalendrier(false);
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div role="group" aria-labelledby="filtres-quand" className="flex flex-col gap-2.5">
            <span id="filtres-quand" className="text-base font-semibold">
              Quand ?
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {options.map((option) => (
                <ChoixDate
                  key={option.cle}
                  selectionne={option.date === date}
                  libelle={option.libelle}
                  detail={option.detail}
                  onClick={() => surModification({ date: option.date })}
                />
              ))}
              <ChoixDate
                selectionne={dateDuCalendrier}
                libelle="Choisir une date"
                detail={dateDuCalendrier && date !== null ? libelleCourt(date) : 'Calendrier'}
                icone
                onClick={() => setCalendrier(true)}
              />
            </div>
          </div>
          {!dureeSeulement && (
            <Selecteur
              libelle="Distance autour de vous"
              options={OPTIONS_RAYON}
              valeur={String(filtres.rayon)}
              surChangement={(valeur) => surModification({ rayon: Number(valeur) })}
              desactive={noteDistance !== null}
              note={noteDistance ?? undefined}
            />
          )}
          <Selecteur
            libelle="Temps de train maximum"
            options={OPTIONS_DUREE}
            valeur={String(filtres.dureeMax)}
            surChangement={(valeur) => surModification({ dureeMax: Number(valeur) })}
          />
          {!dureeSeulement && (
            <div className="flex flex-col divide-y">
              <Interrupteur
                libelle="Faisable dans la journée"
                description="Aller et retour le même jour"
                actif={filtres.faisable}
                surChangement={(faisable) => surModification({ faisable })}
              />
              <Interrupteur
                libelle="Adapté aux poussettes"
                mention={<Badge>Bientôt</Badge>}
                actif={false}
                desactive
              />
            </div>
          )}
          <div className="flex gap-2">
            <Bouton
              variante="secondaire"
              className="flex-1"
              onClick={() =>
                surModification({
                  categories: FILTRES_PAR_DEFAUT.categories,
                  rayon: FILTRES_PAR_DEFAUT.rayon,
                  dureeMax: FILTRES_PAR_DEFAUT.dureeMax,
                  faisable: FILTRES_PAR_DEFAUT.faisable,
                  date: FILTRES_PAR_DEFAUT.date,
                })
              }
            >
              Réinitialiser
            </Bouton>
            <Bouton className="flex-1" onClick={() => changerOuverture(false)}>
              {dureeSeulement ? 'Voir les lieux' : 'Voir les sorties'}
            </Bouton>
          </div>
        </div>
      )}
    </Feuille>
  );
}

/** Une case de « Quand ? » : libellé, et sa date en petit dessous. */
function ChoixDate({
  selectionne,
  libelle,
  detail,
  icone = false,
  onClick,
}: {
  selectionne: boolean;
  libelle: string;
  detail: string;
  icone?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selectionne}
      onClick={onClick}
      className={cn(
        'flex min-h-14 cursor-pointer flex-col justify-center rounded-md border px-3 py-2 text-left transition-colors',
        selectionne
          ? 'border-selection-border bg-selection-bg text-selection-foreground'
          : 'border-border hover:bg-surface-sunken',
      )}
    >
      <span className="flex items-center gap-1.5 text-base font-semibold">
        {icone && <CalendarDays aria-hidden="true" className="size-4.5 flex-none text-primary" />}
        {libelle}
      </span>
      <span className="tabular text-sm text-muted-foreground">{detail}</span>
    </button>
  );
}
