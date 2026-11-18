'use client';

import { BadgeCheck, Footprints, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Bouton } from '@/components/ui/bouton';
import { formaterDistance, formaterDureeEstimee } from '@/lib/geo/formats';
import { sousCategorieAffichee } from '../presentation';
import type { LieuResume } from '../schemas';
import { PhotoLieu } from './photo-lieu';

/**
 * Un lieu sur une surface de marque (fiche destination, maquette du 18/11) : vignette en arc, nom,
 * distance à pied ; la vignette et le texte mènent à la fiche, le bouton rond le montre sur la carte.
 * Pas de ⓘ ici : le crédit de la photo est sur la fiche du lieu (D103).
 */
export function CarteLieuSurMarque({
  lieu,
  lien,
  surCarte,
}: {
  lieu: LieuResume;
  lien: string;
  surCarte: () => void;
}) {
  const sousCategorie = sousCategorieAffichee(lieu.nom, lieu.sousCategorie);
  return (
    <li className="flex h-(--carte-lieu-hauteur) items-center overflow-hidden rounded-carte bg-carte-sur-marque-bg text-carte-sur-marque-texte shadow-carte">
      <Link href={lien} className="flex min-w-0 flex-1 items-center gap-3 self-stretch">
        <span className="vignette-arc">
          <span className="vignette-arc-contenu">
            <PhotoLieu
              photo={lieu.photo}
              nom={lieu.nom}
              categorie={lieu.categorie}
              format="vignette"
              className="size-full items-start justify-start bg-vignette-sur-marque-bg p-6"
              classeIcone="size-6 text-carte-sur-marque-texte"
            />
          </span>
        </span>
        <span className="flex min-w-0 flex-col gap-0.5 py-2">
          <span className="line-clamp-2 leading-tight font-bold">{lieu.nom}</span>
          <span className="tabular flex items-center gap-1 text-sm text-carte-sur-marque-texte-muted">
            <Footprints aria-hidden="true" className="size-4 flex-none" />
            {formaterDureeEstimee(lieu.dureeMarcheMin)} · {formaterDistance(lieu.distanceM)}
          </span>
          {(sousCategorie || lieu.qualiteTourisme) && (
            <span className="flex min-w-0 items-center gap-1 text-sm text-carte-sur-marque-texte-muted">
              {sousCategorie && <span className="truncate">{sousCategorie}</span>}
              {/* Icône seule, sans badge : la card garde sa hauteur ; le badge complet est sur la fiche. */}
              {lieu.qualiteTourisme && (
                <span
                  title="Qualité Tourisme"
                  className="flex flex-none text-carte-sur-marque-texte"
                >
                  <BadgeCheck aria-hidden="true" className="size-4" />
                  <span className="sr-only">Qualité Tourisme</span>
                </span>
              )}
            </span>
          )}
        </span>
      </Link>
      <Bouton
        variante="sur-marque"
        forme="icone"
        className="mr-3"
        aria-label={`Voir ${lieu.nom} sur la carte`}
        onClick={surCarte}
      >
        <MapPin aria-hidden="true" className="size-5" />
      </Bouton>
    </li>
  );
}
