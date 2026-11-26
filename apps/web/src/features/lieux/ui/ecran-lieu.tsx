'use client';

import { ArrowUpRight, BadgeCheck, CalendarRange, MapPin, TrainFront } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Bouton } from '@/components/ui/bouton';
import { BarreRetour } from '@/components/ui/barre-retour';
import { CadreFiche } from '@/components/ui/cadre-fiche';
import { PiedFiche } from '@/components/ui/pied-fiche';
import { EtatVide } from '@/components/ui/etat-vide';
import { Squelette } from '@/components/ui/squelette';
import { useGrandEcran } from '@/features/carte/hooks';
import { CarteLieuxDifferee } from '@/features/carte/ui/carte-lieux-differee';
import { useDateDuJour } from '@/lib/utiliser-date-du-jour';
import { ErreurClient } from '@/lib/http/client';
import { useRetour } from '@/lib/utiliser-retour';
import { useFicheLieu } from '../hooks';
import type { ContexteTrajet } from '../liens';
import { APPARENCE_CATEGORIE, IconeCategorie } from './icone-categorie';
import { HorairesLieu } from './horaires-lieu';
import { EnTeteLieu } from './en-tete-lieu';
import { GaresDuLieu } from './gares-du-lieu';
import { Description, Info } from './infos-lieu';

export function EcranLieu({ cle, trajet }: { cle: string; trajet: ContexteTrajet | null }) {
  const fiche = useFicheLieu(cle);
  const grandEcran = useGrandEcran();
  const surRetour = useRetour();
  const aujourdhui = useDateDuJour();

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
      <CadreFiche carte={null} hautPlein>
        <BarreRetour surRetour={surRetour} />
        <div className="flex flex-col gap-3 px-4 pb-4 sous-barre-retour">
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
  const { libelle } = APPARENCE_CATEGORIE[lieu.categorie];
  const gareProche = lieu.garesProches[0];
  const carte = (
    <CarteLieuxDifferee
      gare={null}
      lieux={[lieu]}
      cleChoisie={lieu.cle}
      surChoix={() => undefined}
    />
  );

  // Maquette Fiche-Lieu (20/11) : toute la fiche sur le fond de la marque, ses cartes sur les surfaces de
  // marque (D106) ; photo en arc en haut, « Y aller en train » dans une feuille en bas.
  return (
    <CadreFiche carte={grandEcran ? carte : null} fond="marque" hautPlein>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-6">
        <EnTeteLieu lieu={lieu} surRetour={surRetour} />

        <div className="flex flex-col gap-4 px-4 pt-2.5">
          <div className="flex flex-col gap-3 px-1">
            <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-pretty">
              {lieu.nom}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex min-h-8 items-center gap-1.5 rounded-pill bg-primary-soft px-3 text-sm font-semibold text-primary-soft-foreground">
                <IconeCategorie categorie={lieu.categorie} className="size-4" />
                {lieu.sousCategorie ? `${libelle} · ${lieu.sousCategorie}` : libelle}
              </span>
              {lieu.qualiteTourisme && (
                <Badge variante="info" className="min-h-8 px-3 text-sm">
                  <BadgeCheck aria-hidden="true" />
                  Qualité Tourisme
                </Badge>
              )}
            </div>
          </div>

          <GaresDuLieu gares={lieu.garesProches} />

          {lieu.description && (
            <Description
              texte={lieu.description}
              source={lieu.attribution}
              credit={lieu.creditDescription}
            />
          )}

          {(lieu.horaires || lieu.periode || lieu.adresse || lieu.commune) && (
            <div className="flex flex-col rounded-carte bg-carte-sur-marque-bg text-carte-sur-marque-texte shadow-carte">
              {lieu.horaires && <HorairesLieu texte={lieu.horaires} dateDuJour={aujourdhui} />}
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
            <Bouton
              variante="fantome-sur-marque"
              asChild
              className="self-start border-[1.5px] border-page-marque-texte-muted"
            >
              <a href={lieu.url} target="_blank" rel="noopener">
                Site officiel
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            </Bouton>
          )}

          {!grandEcran && (
            <div className="h-50 flex-none overflow-hidden rounded-carte shadow-carte">{carte}</div>
          )}

          {/* Description de la source : la source est écrite sous elle (D105), jamais deux fois. Texte
              ajouté (Wikipédia, D123) : il a son propre crédit, la source du lieu reste ici. */}
          {(!lieu.description || lieu.creditDescription) && (
            <p className="px-1 text-xs text-page-marque-texte-muted">{lieu.attribution}</p>
          )}
        </div>
      </div>

      {trajet && gareProche && (
        <PiedFiche>
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
        </PiedFiche>
      )}
    </CadreFiche>
  );
}
