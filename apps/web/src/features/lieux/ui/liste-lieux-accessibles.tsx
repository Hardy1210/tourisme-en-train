'use client';

import type { Categorie } from '@tourisme/commun';
import { BadgeCheck, Footprints, TrainFront } from 'lucide-react';
import Link from 'next/link';
import { Bandeau } from '@/components/ui/bandeau';
import { Bouton } from '@/components/ui/bouton';
import { EtatVide } from '@/components/ui/etat-vide';
import { Squelette } from '@/components/ui/squelette';
import { formaterDuree } from '@/features/destinations/presentation';
import { cn } from '@/lib/classes';
import { formaterDistance } from '@/lib/geo/formats';
import { ErreurClient } from '@/lib/http/client';
import { useLieuxAccessibles } from '../hooks';
import { lienLieu, type ContexteTrajet } from '../liens';
import { libelleCategorieDetaillee } from '../presentation';
import type { ReponseLieuxAccessibles } from '../schemas';
import { APPARENCE_CATEGORIE, IconeCategorie } from './icone-categorie';

type LieuAccessible = ReponseLieuxAccessibles['lieux'][number];

/** Une colonne sur mobile ; sur grand écran, autant que la largeur en permet. */
const GRILLE =
  'flex flex-col gap-4 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] lg:items-start lg:gap-5';

function CarteLieuAccessible({ lieu, trajet }: { lieu: LieuAccessible; trajet: ContexteTrajet }) {
  const { libelle, classeFond, classeTexte } = APPARENCE_CATEGORIE[lieu.categorie];
  return (
    <li className="overflow-hidden rounded-carte bg-carte-bg text-foreground shadow-carte">
      <Link href={lienLieu(lieu.cle, trajet)} className="flex flex-col">
        <div className={cn('relative flex h-40 items-center justify-center', classeFond)}>
          <IconeCategorie categorie={lieu.categorie} className={cn('size-14', classeTexte)} />
          <span
            className={cn(
              'absolute top-3 left-3 flex h-7 max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-pill bg-surface pr-2.5 pl-2 text-sm font-semibold shadow-xs',
              classeTexte,
            )}
          >
            <IconeCategorie categorie={lieu.categorie} className="size-3.5 flex-none" />
            <span className="truncate">
              {libelleCategorieDetaillee(libelle, lieu.sousCategorie)}
            </span>
          </span>
        </div>
        <div className="flex flex-col gap-2 p-4">
          <h3 className="font-display text-xl leading-tight font-bold">{lieu.nom}</h3>
          <span className="flex items-center gap-2 text-md">
            <TrainFront aria-hidden="true" className="size-4 flex-none text-primary" />
            <span>
              <strong className="font-semibold">{lieu.gare.nom}</strong>
              <span className="tabular text-muted-foreground">
                {' '}
                · {formaterDuree(lieu.dureeTrainMin)} en train direct
              </span>
            </span>
          </span>
          <span className="tabular flex items-center gap-2 text-md text-muted-foreground">
            <Footprints aria-hidden="true" className="size-4 flex-none" />
            {lieu.dureeMarcheMin} min à pied · {formaterDistance(lieu.distanceM)}
          </span>
          {lieu.qualiteTourisme && (
            <span className="flex h-6 items-center gap-1 self-start rounded-pill bg-primary-soft pr-2.5 pl-2 text-xs font-bold text-primary-soft-foreground">
              <BadgeCheck aria-hidden="true" className="size-3.5" />
              Qualité Tourisme
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

type Proprietes = {
  gare: { uic: string; nom: string };
  date: string | null;
  categories: readonly Categorie[];
  dureeMax: number;
  surAujourdhui: () => void;
  surToutAfficher: () => void;
};

export function ListeLieuxAccessibles({
  gare,
  date,
  categories,
  dureeMax,
  surAujourdhui,
  surToutAfficher,
}: Proprietes) {
  const requete = useLieuxAccessibles({ gare: gare.uic, date, categories, dureeMax });
  const lieux = requete.data?.pages.flatMap((page) => page.lieux);
  const total = requete.data?.pages[0]?.total;
  const dateHorsHoraires = requete.error instanceof ErreurClient && requete.error.statut === 400;

  return (
    <div className="flex flex-1 flex-col lg:h-full lg:overflow-y-auto">
      <div className="flex flex-col gap-0.5 px-4 pt-1 pb-5 text-hero-foreground lg:gap-1 lg:px-8 lg:pt-8 lg:pb-6">
        <h1 className="font-display text-3xl leading-tight font-bold">Lieux à visiter</h1>
        <p aria-live="polite" className="text-md text-hero-muted">
          {total !== undefined && (
            <strong className="tabular font-semibold text-hero-foreground">
              {total} {total > 1 ? 'lieux' : 'lieu'}{' '}
            </strong>
          )}
          à pied depuis une gare, en train direct depuis {gare.nom}.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-7 lg:gap-5 lg:px-8 lg:pb-9">
        {requete.isPending && (
          <div role="status" aria-label="Chargement des lieux" className={GRILLE}>
            <Squelette className="h-68 rounded-carte" />
            <Squelette className="h-68 rounded-carte" />
          </div>
        )}

        {requete.isError && !requete.isFetchNextPageError && (
          <EtatVide
            titre="Ces lieux n'ont pas pu être chargés"
            texte={requete.error.message}
            className="lg:max-w-130"
          >
            {dateHorsHoraires ? (
              <Bouton variante="secondaire" onClick={surAujourdhui}>
                Revenir à aujourd&apos;hui
              </Bouton>
            ) : (
              <Bouton variante="secondaire" onClick={() => void requete.refetch()}>
                Réessayer
              </Bouton>
            )}
          </EtatVide>
        )}

        {lieux?.length === 0 && (
          <EtatVide
            titre="Aucun lieu pour ces envies"
            texte="Essayez d'autres catégories ou élargissez la durée du trajet."
            className="lg:max-w-130"
          >
            <Bouton variante="secondaire" onClick={surToutAfficher}>
              Tout afficher
            </Bouton>
          </EtatVide>
        )}

        {lieux !== undefined && lieux.length > 0 && (
          <ul
            aria-busy={requete.isPlaceholderData}
            className={cn(GRILLE, 'transition-opacity', requete.isPlaceholderData && 'opacity-60')}
          >
            {lieux.map((lieu) => (
              <CarteLieuAccessible key={lieu.cle} lieu={lieu} trajet={{ depuis: gare.uic, date }} />
            ))}
          </ul>
        )}

        {requete.isFetchNextPageError && (
          <Bandeau variante="danger">Les lieux suivants n&apos;ont pas pu être chargés.</Bandeau>
        )}

        {requete.hasNextPage && (
          <Bouton
            variante="secondaire"
            className="lg:self-center"
            disabled={requete.isFetchingNextPage}
            onClick={() => void requete.fetchNextPage()}
          >
            {requete.isFetchingNextPage ? 'Chargement…' : 'Voir plus'}
          </Bouton>
        )}
      </div>
    </div>
  );
}
