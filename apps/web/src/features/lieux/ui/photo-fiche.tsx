'use client';

// Photo en tête de la fiche lieu (D101, D103) : toute la largeur de la colonne, en 16:9, la grande vignette ;
// la ligne de crédit juste dessous, seulement quand la photo est à l'écran. Sans photo : le bloc de l'icône.
import { useState } from 'react';
import { cn } from '@/lib/classes';
import type { FicheLieu } from '../schemas';
import { LigneCreditPhoto, PhotoLieu } from './photo-lieu';

export function PhotoDeLaFiche({ lieu }: { lieu: Pick<FicheLieu, 'photo' | 'nom' | 'categorie'> }) {
  const [affichee, setAffichee] = useState(false);
  return (
    <>
      <PhotoLieu
        photo={lieu.photo}
        nom={lieu.nom}
        categorie={lieu.categorie}
        format="fiche"
        className={cn('flex-none rounded-xl', lieu.photo ? 'aspect-video w-full' : 'h-30')}
        classeIcone="size-12"
        surAffichage={setAffichee}
      />
      {lieu.photo && affichee && <LigneCreditPhoto photo={lieu.photo} className="-mt-2.5" />}
    </>
  );
}
