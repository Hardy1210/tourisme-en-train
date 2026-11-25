'use client';

import { ChevronRight, TrainFront } from 'lucide-react';
import Link from 'next/link';
import { lienDestination } from '@/features/destinations/liens';
import { formaterDuree } from '@/features/destinations/presentation';
import type { ContexteTrajet } from '../liens';
import type { Rangee } from '../schemas';
import { CarteLieuSurPhoto } from './carte-lieu-sur-photo';

type DonneesRangeeGare = Extract<Rangee, { type: 'gare' }>;

/**
 * Une rangée « gare » de l'onglet Lieux (D121) : la gare, son temps de train et son nombre de lieux,
 * « Voir tout » vers sa fiche destination, puis ses premiers lieux qu'on fait défiler de côté.
 */
export function RangeeGare({
  rangee,
  trajet,
}: {
  rangee: DonneesRangeeGare;
  trajet: ContexteTrajet;
}) {
  const { gare, dureeTrainMin, total, lieux } = rangee;
  const titre = `rangee-${gare.uic}`;
  return (
    <section aria-labelledby={titre} className="flex flex-col gap-2.5">
      <div className="flex items-end justify-between gap-3 px-4 text-hero-foreground lg:px-8">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id={titre} className="truncate font-display text-xl font-bold">
            {gare.nom}
          </h2>
          <span className="tabular flex items-center gap-1.5 text-sm text-hero-muted">
            <TrainFront aria-hidden="true" className="size-4 flex-none" />
            <span className="rounded-pill bg-accent px-2 text-xs leading-5 font-bold text-accent-foreground">
              {formaterDuree(dureeTrainMin)}
            </span>
            · {total} {total > 1 ? 'lieux' : 'lieu'}
          </span>
        </div>
        <Link
          href={lienDestination(gare.uic, trajet)}
          aria-label={`Voir tous les lieux de ${gare.nom}`}
          className="flex min-h-touch flex-none items-center gap-1 text-md font-semibold"
        >
          Voir tout
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <ul className="scrollbar-none flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 lg:scroll-px-8 lg:px-8">
        {lieux.map((lieu) => (
          <CarteLieuSurPhoto key={lieu.cle} lieu={lieu} trajet={trajet} />
        ))}
      </ul>
    </section>
  );
}
