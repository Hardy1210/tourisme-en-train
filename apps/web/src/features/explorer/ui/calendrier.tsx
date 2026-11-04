'use client';

import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useState } from 'react';
import { Bouton } from '@/components/ui/bouton';
import {
  debutDeMois,
  grilleDuMois,
  libelleComplet,
  libelleCourt,
  libelleMois,
} from '@/lib/dates/calendrier';
import { cn } from '@/lib/classes';

const JOURS = [
  ['L', 'lundi'],
  ['M', 'mardi'],
  ['M', 'mercredi'],
  ['J', 'jeudi'],
  ['V', 'vendredi'],
  ['S', 'samedi'],
  ['D', 'dimanche'],
] as const;

type Proprietes = {
  dateDuJour: string;
  /** Dernier jour des horaires chargés ; null si inconnu. */
  fin: string | null;
  depart: string | null;
  surChoix: (date: string) => void;
};

/** Grille d'un mois : seuls les jours entre aujourd'hui et la fin des horaires se choisissent. */
export function Calendrier({ dateDuJour, fin, depart, surChoix }: Proprietes) {
  const [mois, setMois] = useState(debutDeMois(depart ?? dateDuJour));
  const [selection, setSelection] = useState(depart);
  const premierMois = debutDeMois(dateDuJour);
  const dernierMois = fin === null ? null : debutDeMois(fin);
  const titre = libelleMois(mois);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <Bouton
          variante="secondaire"
          forme="icone"
          className="rounded-pill"
          aria-label="Mois précédent"
          disabled={mois <= premierMois}
          onClick={() => setMois(debutDeMois(mois, -1))}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Bouton>
        <span aria-live="polite" className="font-display text-lg font-bold">
          {titre}
        </span>
        <Bouton
          variante="secondaire"
          forme="icone"
          className="rounded-pill"
          aria-label="Mois suivant"
          disabled={dernierMois !== null && mois >= dernierMois}
          onClick={() => setMois(debutDeMois(mois, 1))}
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </Bouton>
      </div>

      <div role="group" aria-label={titre} className="grid grid-cols-7 gap-y-1">
        {JOURS.map(([lettre, nom]) => (
          <abbr
            key={nom}
            title={nom}
            className="flex h-7 items-center justify-center text-xs font-semibold text-muted-foreground no-underline"
          >
            {lettre}
          </abbr>
        ))}
        {grilleDuMois(mois).map((jour, index) =>
          jour === null ? (
            <span key={`vide-${index}`} aria-hidden="true" />
          ) : (
            <div key={jour} className="flex h-12 items-center justify-center">
              <button
                type="button"
                aria-label={libelleComplet(jour)}
                aria-pressed={jour === selection}
                aria-current={jour === dateDuJour ? 'date' : undefined}
                disabled={jour < dateDuJour || (fin !== null && jour > fin)}
                onClick={() => setSelection(jour)}
                className={cn(
                  'tabular size-touch cursor-pointer rounded-pill text-md transition-colors enabled:hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-40',
                  jour === dateDuJour && 'border-2 border-selection-border font-bold',
                  jour === selection &&
                    'bg-primary font-bold text-primary-foreground enabled:hover:bg-primary-hover',
                )}
              >
                {Number(jour.slice(8))}
              </button>
            </div>
          ),
        )}
      </div>

      {fin !== null && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Info aria-hidden="true" className="size-4 flex-none" />
          Horaires disponibles jusqu&apos;au {libelleCourt(fin).toLowerCase()}
        </p>
      )}

      <Bouton
        className="h-13 text-base"
        disabled={selection === null}
        onClick={() => {
          if (selection !== null) surChoix(selection);
        }}
      >
        {selection === null
          ? 'Voir les sorties'
          : `Voir les sorties du ${libelleCourt(selection).toLowerCase()}`}
      </Bouton>
    </div>
  );
}
