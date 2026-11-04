'use client';

import { BadgeCheck, ChevronRight, Footprints, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRef, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bouton } from '@/components/ui/bouton';
import { EtatVide } from '@/components/ui/etat-vide';
import { Squelette } from '@/components/ui/squelette';
import { cn } from '@/lib/classes';
import { formaterDistance } from '@/lib/geo/formats';
import { grouperParCategorie } from '../presentation';
import type { LieuResume } from '../schemas';
import { APPARENCE_CATEGORIE, IconeCategorie } from './icone-categorie';

function LigneLieu({
  lieu,
  lien,
  surCarte,
}: {
  lieu: LieuResume;
  lien: string;
  surCarte: () => void;
}) {
  return (
    <li className="flex flex-col gap-1.5 border-b px-3 py-2.5 last:border-b-0">
      <Link href={lien} className="flex items-start justify-between gap-2">
        <span className="font-semibold">{lieu.nom}</span>
        <ChevronRight aria-hidden="true" className="size-5 flex-none text-muted-foreground" />
      </Link>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span className="tabular flex items-center gap-1">
          <Footprints aria-hidden="true" className="size-4" />
          {lieu.dureeMarcheMin} min · {formaterDistance(lieu.distanceM)}
        </span>
        {lieu.sousCategorie && <span>{lieu.sousCategorie}</span>}
        {lieu.qualiteTourisme && (
          <Badge variante="info">
            <BadgeCheck aria-hidden="true" />
            Qualité Tourisme
          </Badge>
        )}
        <Bouton
          variante="fantome"
          className="ml-auto h-8 px-2 text-sm font-semibold text-primary"
          onClick={surCarte}
        >
          <MapPin aria-hidden="true" className="size-4" />
          Voir sur la carte
        </Bouton>
      </div>
    </li>
  );
}

type Proprietes = {
  lieuxCharges: boolean;
  lieux: readonly LieuResume[] | undefined;
  chargement: boolean;
  erreur: boolean;
  surReessai: () => void;
  surTrains: () => void;
  lienDe: (cle: string) => string;
  surCarte: (cle: string) => void;
  /** Mini-carte, sur mobile ; sur grand écran, la carte occupe la colonne de droite. */
  carte: ReactNode;
};

export function OngletLieux({
  lieuxCharges,
  lieux,
  chargement,
  erreur,
  surReessai,
  surTrains,
  lienDe,
  surCarte,
  carte,
}: Proprietes) {
  const blocCarte = useRef<HTMLDivElement>(null);
  if (!lieuxCharges) {
    return (
      <EtatVide
        titre="Les lieux de cette destination ne sont pas encore disponibles"
        texte="Pour l'instant, nous couvrons la Bourgogne-Franche-Comté. Les trains, eux, sont bien réels."
      >
        <Bouton variante="secondaire" onClick={surTrains}>
          Voir les trains
        </Bouton>
      </EtatVide>
    );
  }
  if (chargement) return <Squelette aria-hidden="true" className="h-64 rounded-lg" />;
  if (erreur) {
    return (
      <EtatVide titre="Ces lieux n'ont pas pu être chargés" texte="Réessayez dans un instant.">
        <Bouton variante="secondaire" onClick={surReessai}>
          Réessayer
        </Bouton>
      </EtatVide>
    );
  }
  if (!lieux || lieux.length === 0) {
    return (
      <EtatVide
        titre="Aucun lieu repéré à pied de cette gare"
        texte="Nos sources ne signalent pas de sortie à proximité. D'autres gares en ont peut-être davantage."
      >
        <Bouton variante="secondaire" onClick={surTrains}>
          Voir les trains
        </Bouton>
      </EtatVide>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {carte && (
        <div ref={blocCarte} className="h-52 flex-none scroll-mt-1 overflow-hidden rounded-lg">
          {carte}
        </div>
      )}
      {grouperParCategorie(lieux).map(({ categorie, lieux: duGroupe }) => {
        const { libelle, classeFond, classeTexte } = APPARENCE_CATEGORIE[categorie];
        return (
          <section key={categorie} className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-md font-bold">
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-pill',
                  classeFond,
                  classeTexte,
                )}
              >
                <IconeCategorie categorie={categorie} className="size-4" />
              </span>
              {libelle}
              <span className="tabular text-sm font-normal text-muted-foreground">
                {duGroupe.length}
              </span>
            </h3>
            <ul className="rounded-carte bg-carte-bg shadow-carte">
              {duGroupe.map((lieu) => (
                <LigneLieu
                  key={lieu.cle}
                  lieu={lieu}
                  lien={lienDe(lieu.cle)}
                  surCarte={() => {
                    surCarte(lieu.cle);
                    blocCarte.current?.scrollIntoView({ block: 'nearest' });
                  }}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
