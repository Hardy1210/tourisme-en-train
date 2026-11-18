'use client';

// Photo en tête de la fiche lieu (D101, D103) : toute la largeur de la colonne, en 16:9, la grande vignette.
// Crédit : un ⓘ discret en bas à gauche de la photo, seulement quand elle est à l'écran, qui ouvre le crédit
// complet (Hardy, 18/11). Sans photo : le bloc de l'icône.
import { useState } from 'react';
import { cn } from '@/lib/classes';
import type { FicheLieu } from '../schemas';
import { BoutonCreditPhoto, PhotoLieu } from './photo-lieu';

export function PhotoDeLaFiche({ lieu }: { lieu: Pick<FicheLieu, 'photo' | 'nom' | 'categorie'> }) {
  const [affichee, setAffichee] = useState(false);
  return (
    <div className="relative flex-none">
      <PhotoLieu
        photo={lieu.photo}
        nom={lieu.nom}
        categorie={lieu.categorie}
        format="fiche"
        className={cn('rounded-xl', lieu.photo ? 'aspect-video w-full' : 'h-30')}
        classeIcone="size-12"
        surAffichage={setAffichee}
      />
      {lieu.photo && affichee && (
        <BoutonCreditPhoto
          photo={lieu.photo}
          alignement="start"
          className="absolute bottom-0 left-0 opacity-80 hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
        />
      )}
    </div>
  );
}
