'use client';

import { dateDuJour, type Categorie } from '@tourisme/commun';
import { Bandeau } from '@/components/ui/bandeau';
import { Bouton } from '@/components/ui/bouton';
import { EtatVide } from '@/components/ui/etat-vide';
import { Squelette } from '@/components/ui/squelette';
import { suffixeDate } from '@/features/explorer/date';
import { cn } from '@/lib/classes';
import { ErreurClient } from '@/lib/http/client';
import { useRangeesLieux } from '../hooks';
import type { ContexteTrajet } from '../liens';
import type { Rangee } from '../schemas';
import { RangeeGare } from './rangee-gare';

/** Le dessin de chaque sorte de rangée (D121) : une nouvelle sorte ajoute son cas ici. */
function UneRangee({ rangee, trajet }: { rangee: Rangee; trajet: ContexteTrajet }) {
  switch (rangee.type) {
    case 'gare':
      return <RangeeGare rangee={rangee} trajet={trajet} />;
  }
}

type Proprietes = {
  gare: { uic: string; nom: string };
  date: string | null;
  categories: readonly Categorie[];
  dureeMax: number;
  surAujourdhui: () => void;
  surToutAfficher: () => void;
};

/** Onglet Lieux (D056, D121) : le titre et le nombre de lieux, puis une rangée par gare d'arrivée. */
export function RangeesLieux({
  gare,
  date,
  categories,
  dureeMax,
  surAujourdhui,
  surToutAfficher,
}: Proprietes) {
  const requete = useRangeesLieux({ gare: gare.uic, date, categories, dureeMax });
  const rangees = requete.data?.pages.flatMap((page) => page.rangees);
  const total = requete.data?.pages[0]?.total;
  const dateHorsHoraires = requete.error instanceof ErreurClient && requete.error.statut === 400;
  const trajet = { depuis: gare.uic, date };

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
          à pied depuis une gare, en train direct depuis {gare.nom}
          {suffixeDate(date, dateDuJour())}.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-6 pb-7 lg:pb-9">
        {requete.isPending && (
          <div role="status" aria-label="Chargement des lieux" className="flex gap-3 px-4 lg:px-8">
            <Squelette className="h-(--carte-rangee-hauteur) w-(--carte-rangee-largeur) flex-none rounded-carte" />
            <Squelette className="h-(--carte-rangee-hauteur) w-(--carte-rangee-largeur) flex-none rounded-carte" />
          </div>
        )}

        {requete.isError && !requete.isFetchNextPageError && (
          <EtatVide
            titre="Ces lieux n'ont pas pu être chargés"
            texte={requete.error.message}
            className="mx-4 lg:mx-8 lg:max-w-130"
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

        {rangees?.length === 0 && (
          <EtatVide
            titre="Aucun lieu pour ces envies"
            texte="Essayez d'autres catégories ou élargissez la durée du trajet."
            className="mx-4 lg:mx-8 lg:max-w-130"
          >
            <Bouton variante="secondaire" onClick={surToutAfficher}>
              Tout afficher
            </Bouton>
          </EtatVide>
        )}

        {rangees !== undefined && rangees.length > 0 && (
          <div
            aria-busy={requete.isPlaceholderData}
            className={cn(
              'flex flex-col gap-6 transition-opacity',
              requete.isPlaceholderData && 'opacity-60',
            )}
          >
            {rangees.map((rangee) => (
              <UneRangee
                key={`${rangee.type}-${rangee.gare.uic}`}
                rangee={rangee}
                trajet={trajet}
              />
            ))}
          </div>
        )}

        {requete.isFetchNextPageError && (
          <Bandeau variante="danger" className="mx-4 lg:mx-8">
            Les rangées suivantes n&apos;ont pas pu être chargées.
          </Bandeau>
        )}

        {requete.hasNextPage && (
          <Bouton
            variante="secondaire"
            className="mx-4 lg:mx-8 lg:self-center"
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
