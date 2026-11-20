'use client';

// Haut de la fiche lieu (maquette Fiche-Lieu, 20/11) : la photo sur toute la largeur, découpée par un grand
// cercle et bordée de jaune (`entete-arc`, globals.css) ; Retour en haut à gauche, crédit ⓘ en haut à
// droite, seulement quand la photo est à l'écran (D103). Sans photo : même courbe, plus basse, sur le fond
// de la marque, avec l'icône de la catégorie.
import { useState } from 'react';
import { BoutonRetour } from '@/components/ui/bouton';
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
      <BoutonRetour surPhoto className="absolute top-3.5 left-3" onClick={surRetour} />
      {lieu.photo && affichee && (
        <BoutonCreditPhoto photo={lieu.photo} surPhoto className="absolute top-3.5 right-3" />
      )}
    </div>
  );
}
