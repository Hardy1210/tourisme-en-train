'use client';

import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarRange,
  Clock,
  Footprints,
  MapPin,
  TrainFront,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Bouton } from '@/components/ui/bouton';
import { CadreFiche } from '@/components/ui/cadre-fiche';
import { EtatVide } from '@/components/ui/etat-vide';
import { Squelette } from '@/components/ui/squelette';
import { useGrandEcran } from '@/features/carte/hooks';
import { CarteLieuxDifferee } from '@/features/carte/ui/carte-lieux-differee';
import { cn } from '@/lib/classes';
import { ErreurClient } from '@/lib/http/client';
import { formaterDistance } from '@/lib/geo/formats';
import { useRetour } from '@/lib/utiliser-retour';
import { useFicheLieu } from '../hooks';
import type { ContexteTrajet } from '../liens';
import { APPARENCE_CATEGORIE, IconeCategorie } from './icone-categorie';
import { Description, Info } from './infos-lieu';

export function EcranLieu({ cle, trajet }: { cle: string; trajet: ContexteTrajet | null }) {
  const fiche = useFicheLieu(cle);
  const grandEcran = useGrandEcran();
  const surRetour = useRetour();

  const boutonRetour = (
    <Bouton variante="fantome" className="-ml-2 self-start px-2 font-semibold" onClick={surRetour}>
      <ArrowLeft aria-hidden="true" className="size-5" />
      Retour
    </Bouton>
  );

  if (fiche.isPending) {
    return (
      <CadreFiche carte={<div aria-hidden="true" className="h-full bg-map-land" />}>
        <div aria-hidden="true" className="flex flex-col gap-3 p-4">
          <Squelette className="h-32 rounded-lg" />
          <Squelette className="h-48 rounded-lg" />
        </div>
      </CadreFiche>
    );
  }
  if (fiche.isError) {
    const introuvable = fiche.error instanceof ErreurClient && fiche.error.statut === 404;
    return (
      <CadreFiche carte={null}>
        <div className="flex flex-col gap-3 p-4">
          {boutonRetour}
          <EtatVide
            titre={introuvable ? "Ce lieu n'existe pas ou plus" : 'Un problème est survenu'}
            texte={
              introuvable
                ? 'Retrouvez toutes les sorties possibles depuis l’écran Explorer.'
                : 'Réessayez dans un instant.'
            }
          >
            {!introuvable && (
              <Bouton variante="secondaire" onClick={() => void fiche.refetch()}>
                Réessayer
              </Bouton>
            )}
          </EtatVide>
        </div>
      </CadreFiche>
    );
  }

  const lieu = fiche.data;
  const { libelle, classeFond, classeTexte } = APPARENCE_CATEGORIE[lieu.categorie];
  const gareProche = lieu.garesProches[0];
  const carte = (
    <CarteLieuxDifferee
      gare={null}
      lieux={[lieu]}
      cleChoisie={lieu.cle}
      surChoix={() => undefined}
    />
  );

  return (
    <CadreFiche carte={grandEcran ? carte : null}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-1 pb-6">
        {boutonRetour}
        <div
          aria-hidden="true"
          className={cn('flex h-30 flex-none items-center justify-center rounded-xl', classeFond)}
        >
          <IconeCategorie categorie={lieu.categorie} className="size-12" />
        </div>

        <div className="flex flex-col gap-2.5">
          <h1 className="text-3xl leading-tight font-bold text-pretty">{lieu.nom}</h1>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'inline-flex min-h-7 items-center gap-1 rounded-pill pr-2.5 pl-2 text-sm font-semibold',
                classeFond,
                classeTexte,
              )}
            >
              <IconeCategorie categorie={lieu.categorie} className="size-4" />
              {lieu.sousCategorie ? `${libelle} · ${lieu.sousCategorie}` : libelle}
            </span>
            {lieu.qualiteTourisme && (
              <Badge variante="info">
                <BadgeCheck aria-hidden="true" />
                Qualité Tourisme
              </Badge>
            )}
          </div>
        </div>

        {lieu.garesProches.length > 0 && (
          <section
            aria-label="Depuis la gare"
            className="flex flex-col rounded-carte bg-carte-bg shadow-carte"
          >
            {lieu.garesProches.map((g) => (
              <div
                key={g.uic}
                className="flex items-center gap-3 border-b px-3.5 py-3 last:border-b-0"
              >
                <span className="flex size-10 flex-none items-center justify-center rounded-md bg-primary-soft">
                  <TrainFront aria-hidden="true" className="size-5 text-primary" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="font-semibold">Gare de {g.nom}</span>
                  <span className="tabular flex items-center gap-1 text-sm text-muted-foreground">
                    <Footprints aria-hidden="true" className="size-3.5" />
                    {g.dureeMarcheMin} min à pied ({formaterDistance(g.distanceM)})
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}

        {lieu.description && <Description texte={lieu.description} />}

        {(lieu.horaires || lieu.periode || lieu.adresse || lieu.commune) && (
          <div className="flex flex-col rounded-carte bg-carte-bg shadow-carte">
            {lieu.horaires && (
              <Info Icone={Clock} titre="Horaires">
                {lieu.horaires}
              </Info>
            )}
            {lieu.periode && (
              <Info Icone={CalendarRange} titre="Période">
                {lieu.periode}
              </Info>
            )}
            {(lieu.adresse || lieu.commune) && (
              <Info Icone={MapPin} titre="Adresse">
                {[lieu.adresse, lieu.commune].filter(Boolean).join(', ')}
              </Info>
            )}
          </div>
        )}

        {lieu.url && (
          <Bouton variante="secondaire" asChild className="self-start">
            <a href={lieu.url} target="_blank" rel="noopener">
              Site officiel
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          </Bouton>
        )}

        {!grandEcran && <div className="h-44 flex-none overflow-hidden rounded-lg">{carte}</div>}

        <p className="text-xs text-muted-foreground">{lieu.attribution}</p>
      </div>

      {trajet && gareProche && (
        <footer className="flex-none border-t bg-surface px-4 pt-2.5 pb-3 safe-bottom">
          <Bouton asChild className="w-full">
            <Link
              href={`/destinations/${gareProche.uic}?${new URLSearchParams({
                depuis: trajet.depuis,
                onglet: 'trains',
                ...(trajet.date ? { date: trajet.date } : {}),
              }).toString()}`}
            >
              <TrainFront aria-hidden="true" className="size-4.5" />Y aller en train
            </Link>
          </Bouton>
        </footer>
      )}
    </CadreFiche>
  );
}
