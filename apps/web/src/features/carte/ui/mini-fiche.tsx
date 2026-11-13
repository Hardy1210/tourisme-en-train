import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Bouton, BoutonFermer } from '@/components/ui/bouton';
import {
  formaterDuree,
  formaterNombreLieux,
  totalLieux,
} from '@/features/destinations/presentation';
import { PastillesCategories } from '@/features/destinations/ui/pastilles-categories';
import type { Destination } from '@/features/destinations/schemas';
import type { LieuResume } from '@/features/lieux/schemas';
import { useFicheLieu } from '@/features/lieux/hooks';
import { lienLieu } from '@/features/lieux/liens';
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
    // Sur mobile, la carte passe sous l'en-tête, pas la feuille : ce cadre part du même point qu'elle (D072).
    // Feuille tout en haut : plus de carte à voir, la fiche se cache et revient quand la feuille redescend.
    <div className="pointer-events-none absolute inset-x-3 top-(--en-tete-hauteur) bottom-0 lg:top-0 max-lg:in-data-[feuille=plein]:hidden">
      <div className="pointer-events-auto absolute inset-x-0 top-[calc(var(--resultats-haut)-2rem)] flex -translate-y-full flex-col gap-1 rounded-lg bg-surface-raised px-3 py-2 shadow-float transition-[top] duration-300 ease-soft">
        <div className="flex items-center justify-between gap-2">
          <h3 className="min-w-0 truncate text-lg font-bold">{titre}</h3>
          <BoutonFermer className="-mr-2" onClick={surFermeture} />
        </div>
        {children}
      </div>
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
  const nombre = totalLieux(d.lieuxParCategorie);
  return (
    <Cadre titre={d.titre} surFermeture={surFermeture}>
      <p className="tabular text-sm text-muted-foreground">
        {formaterDuree(d.dureeMin)} en train direct · {d.nbTrains}{' '}
        {d.nbTrains > 1 ? 'trains' : 'train'}/jour
      </p>
      {nombre > 0 && (
        <>
          <p className="tabular text-sm font-semibold">
            {formaterNombreLieux(nombre)} à voir à pied depuis la gare
          </p>
          <PastillesCategories lieuxParCategorie={d.lieuxParCategorie} className="mt-0.5" />
        </>
      )}
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
      <p className="tabular text-sm text-muted-foreground">
        {APPARENCE_CATEGORIE[lieu.categorie].libelle} · {lieu.dureeMarcheMin} min à pied ·{' '}
        {formaterDistance(lieu.distanceM)}
      </p>
      <Bouton variante="sortie" asChild className="mt-1 self-end">
        <Link href={lienLieu(lieu.cle)}>
          Voir le lieu
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </Bouton>
    </Cadre>
  );
}

/**
 * Mini-fiche d'un lieu touché parmi tous les lieux de la carte (D091) : la carte ne connaît que sa clé,
 * le nom et la catégorie arrivent avec sa fiche.
 */
export function MiniFicheLieuCarte({
  cle,
  surFermeture,
}: {
  cle: string;
  surFermeture: () => void;
}) {
  const fiche = useFicheLieu(cle);
  return (
    <Cadre titre={fiche.data?.nom ?? 'Chargement…'} surFermeture={surFermeture}>
      {fiche.data && (
        <p className="text-sm text-muted-foreground">
          {APPARENCE_CATEGORIE[fiche.data.categorie].libelle}
          {fiche.data.commune ? ` · ${fiche.data.commune}` : ''}
        </p>
      )}
      <Bouton variante="sortie" asChild className="mt-1 self-end">
        <Link href={lienLieu(cle)}>
          Voir le lieu
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </Bouton>
    </Cadre>
  );
}
