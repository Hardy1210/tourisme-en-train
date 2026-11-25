'use client';

import { Footprints } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/classes';
import { formaterDistance, formaterDureeEstimee } from '@/lib/geo/formats';
import { lienLieu, type ContexteTrajet } from '../liens';
import { libelleCategorieDetaillee } from '../presentation';
import type { LieuResume } from '../schemas';
import { APPARENCE_CATEGORIE, IconeCategorie } from './icone-categorie';
import { BoutonCreditPhoto, PhotoLieu } from './photo-lieu';

/**
 * Un lieu dans une rangée de l'onglet Lieux (maquette Lieux-Rangees, D121) : la photo occupe la carte, le
 * nom et la marche sont posés en bas sur un voile sombre ; sans photo, le fond de marque et une grande
 * icône de catégorie. Le ⓘ du crédit est un frère du lien (un bouton ne va pas dans un lien).
 */
export function CarteLieuSurPhoto({ lieu, trajet }: { lieu: LieuResume; trajet: ContexteTrajet }) {
  const { libelle, classeTexte } = APPARENCE_CATEGORIE[lieu.categorie];
  return (
    <li className="relative h-(--carte-rangee-hauteur) w-(--carte-rangee-largeur) flex-none snap-start overflow-hidden rounded-carte bg-carte-sur-marque-bg shadow-carte">
      <Link href={lienLieu(lieu.cle, trajet)} className="absolute inset-0 text-sur-photo-texte">
        <PhotoLieu
          photo={lieu.photo}
          nom={lieu.nom}
          categorie={lieu.categorie}
          format="carte"
          className="absolute inset-0 items-start justify-end bg-carte-sur-marque-bg pt-2.5"
          classeIcone="-mr-3.5 size-36 text-hero-tile"
        />
        {lieu.photo && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[70%] bg-linear-to-t from-sur-photo-voile from-35% to-transparent"
          />
        )}
        <span
          className={cn(
            'absolute top-2.5 left-2.5 flex h-7 max-w-[calc(100%-4rem)] items-center gap-1 rounded-pill bg-surface pr-2.5 pl-2 text-sm font-semibold',
            classeTexte,
          )}
        >
          <IconeCategorie categorie={lieu.categorie} className="size-3.5 flex-none" />
          <span className="truncate">{libelleCategorieDetaillee(libelle, lieu.sousCategorie)}</span>
        </span>
        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 px-3.5 pb-3">
          <span className="line-clamp-2 font-display text-lg leading-tight font-bold">
            {lieu.nom}
          </span>
          <span className="tabular flex items-center gap-1.5 text-sm text-sur-photo-texte-muted">
            <Footprints aria-hidden="true" className="size-4 flex-none" />
            {formaterDureeEstimee(lieu.dureeMarcheMin)} à pied · {formaterDistance(lieu.distanceM)}
          </span>
        </span>
      </Link>
      {lieu.photo && (
        <BoutonCreditPhoto photo={lieu.photo} surPhoto className="absolute top-1 right-1" />
      )}
    </li>
  );
}
