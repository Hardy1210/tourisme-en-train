import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Bouton, BoutonFermer } from '@/components/ui/bouton';
import { formaterDuree } from '@/features/destinations/presentation';
import type { Destination } from '@/features/destinations/schemas';
import type { LieuResume } from '@/features/lieux/schemas';
import { APPARENCE_CATEGORIE } from '@/features/lieux/ui/icone-categorie';
import { formaterDistance } from '@/lib/geo/formats';

function Cadre({
  titre,
  surFermeture,
  children,
}: {
  titre: string;
  surFermeture: () => void;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-x-3 bottom-11 flex flex-col gap-1 rounded-lg bg-surface-raised px-3 py-2 shadow-float">
      <div className="flex items-center justify-between gap-2">
        <h3 className="min-w-0 truncate text-lg font-bold">{titre}</h3>
        <BoutonFermer className="-mr-2" onClick={surFermeture} />
      </div>
      {children}
    </div>
  );
}

export function MiniFicheDestination({
  destination: d,
  lien,
  surFermeture,
}: {
  destination: Destination;
  lien: string;
  surFermeture: () => void;
}) {
  return (
    <Cadre titre={d.titre} surFermeture={surFermeture}>
      <p className="tabular text-sm text-muted-foreground">
        {formaterDuree(d.dureeMin)} en train direct · {d.nbTrains}{' '}
        {d.nbTrains > 1 ? 'trains' : 'train'}/jour
      </p>
      <Bouton variante="sortie" asChild className="mt-1 self-end">
        <Link href={lien}>
          Voir la sortie
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </Bouton>
    </Cadre>
  );
}

export function MiniFicheLieu({
  lieu,
  surFermeture,
}: {
  lieu: LieuResume;
  surFermeture: () => void;
}) {
  return (
    <Cadre titre={lieu.nom} surFermeture={surFermeture}>
      <p className="tabular pb-1 text-sm text-muted-foreground">
        {APPARENCE_CATEGORIE[lieu.categorie].libelle} · {lieu.dureeMarcheMin} min à pied ·{' '}
        {formaterDistance(lieu.distanceM)}
      </p>
    </Cadre>
  );
}
