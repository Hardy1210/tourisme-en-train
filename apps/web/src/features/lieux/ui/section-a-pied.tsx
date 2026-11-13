import { Footprints } from 'lucide-react';
import Link from 'next/link';
import { Bandeau } from '@/components/ui/bandeau';
import { Bouton } from '@/components/ui/bouton';
import { Squelette } from '@/components/ui/squelette';
import { cn } from '@/lib/classes';
import { formaterDistance } from '@/lib/geo/formats';
import { lienLieu } from '../liens';
import type { LieuResume } from '../schemas';
import { APPARENCE_CATEGORIE, IconeCategorie } from './icone-categorie';

function CarteLieu({ lieu }: { lieu: LieuResume }) {
  const { libelle, classeFond, classeTexte } = APPARENCE_CATEGORIE[lieu.categorie];
  return (
    <li className="w-47 flex-none overflow-hidden rounded-carte bg-carte-bg shadow-carte">
      <Link href={lienLieu(lieu.cle)} className="flex h-full flex-col">
        <div className={cn('flex h-24 items-center justify-center', classeFond)}>
          <IconeCategorie categorie={lieu.categorie} className="size-10" />
        </div>
        <div className="flex flex-col gap-2 p-3">
          <h3 className="line-clamp-2 min-h-10 text-base leading-tight font-semibold">
            {lieu.nom}
          </h3>
          <span
            className={cn(
              'inline-flex h-6.5 items-center gap-1 self-start rounded-pill pr-2 pl-1.5 text-xs font-semibold',
              classeFond,
              classeTexte,
            )}
          >
            <IconeCategorie categorie={lieu.categorie} className="size-3.5" />
            {libelle}
          </span>
          <span className="tabular flex items-center gap-1 text-sm text-muted-foreground">
            <Footprints aria-hidden="true" className="size-4 flex-none" />
            {lieu.dureeMarcheMin} min · {formaterDistance(lieu.distanceM)}
          </span>
        </div>
      </Link>
    </li>
  );
}

type Proprietes = {
  titre: string;
  rayonLibelle: string;
  lieux: readonly LieuResume[] | undefined;
  chargement: boolean;
  erreur: boolean;
  surReessai: () => void;
};

/** « Près de vous » ou « Près de la gare de… » (maquette v6) : tous les lieux à pied, sans le tri propre à l'onglet Lieux. */
export function SectionAPied({
  titre,
  rayonLibelle,
  lieux,
  chargement,
  erreur,
  surReessai,
}: Proprietes) {
  return (
    <section aria-labelledby="a-pied" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="a-pied" className="text-xl font-bold">
          {titre}
        </h2>
        <span className="tabular text-sm whitespace-nowrap text-muted-foreground">
          à moins de {rayonLibelle}
        </span>
      </div>
      {chargement && (
        <div className="flex gap-3 overflow-hidden" aria-hidden="true">
          <Squelette className="h-52 w-47 flex-none rounded-carte" />
          <Squelette className="h-52 w-47 flex-none rounded-carte" />
        </div>
      )}
      {erreur && (
        <Bandeau variante="danger" className="justify-between">
          Ces lieux n&apos;ont pas pu être chargés.{' '}
          <Bouton variante="fantome" className="ml-1 h-auto underline" onClick={surReessai}>
            Réessayer
          </Bouton>
        </Bandeau>
      )}
      {lieux?.length === 0 && (
        <p className="rounded-lg bg-surface-sunken px-4 py-3.5 text-md text-muted-foreground">
          Rien pour ces envies à moins de {rayonLibelle} à pied.
        </p>
      )}
      {lieux !== undefined && lieux.length > 0 && (
        <ul className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pt-0.5 pb-2 lg:mx-0 lg:px-0">
          {lieux.map((lieu) => (
            <CarteLieu key={lieu.cle} lieu={lieu} />
          ))}
        </ul>
      )}
    </section>
  );
}
