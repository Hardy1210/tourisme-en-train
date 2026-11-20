'use client';

// Haut de la fiche lieu (maquette Fiche-Lieu, 20/11) : la photo sur toute la largeur, jusqu'en haut de
// l'écran derrière l'heure et la batterie (`CadreFiche hautPlein`), découpée par un grand cercle et bordée
// de jaune (`entete-arc`, globals.css). Barre du haut commune (`BarreRetour`) : Retour à gauche, crédit ⓘ à
// droite, seulement quand la photo est à l'écran (D103). Sans photo : même courbe, plus basse, sur le fond
// de la marque, avec l'icône de la catégorie.
import { useState } from 'react';
import { BarreRetour } from '@/components/ui/barre-retour';
import { cn } from '@/lib/classes';
import type { FicheLieu } from '../schemas';
import { BoutonCreditPhoto, PhotoLieu } from './photo-lieu';

export function EnTeteLieu({
  lieu,
  surRetour,
}: {
  lieu: Pick<FicheLieu, 'photo' | 'nom' | 'categorie'>;
  surRetour: () => void;
}) {
  const [affichee, setAffichee] = useState(false);
  return (
    <div className="@container relative flex-none">
      <div className={cn('entete-arc', !lieu.photo && 'entete-arc-sans-photo')}>
        <div className="entete-arc-contenu">
          <PhotoLieu
            photo={lieu.photo}
            nom={lieu.nom}
            categorie={lieu.categorie}
            format="fiche"
            className="size-full bg-vignette-sur-marque-bg"
            classeIcone="size-12 text-carte-sur-marque-texte"
            surAffichage={setAffichee}
          />
        </div>
      </div>
      {/* Retour et crédit : la barre commune, même place que sur toutes les fiches. */}
      <BarreRetour
        surRetour={surRetour}
        droite={
          lieu.photo &&
          affichee && <BoutonCreditPhoto photo={lieu.photo} surPhoto alignement="end" />
        }
      />
    </div>
  );
}
