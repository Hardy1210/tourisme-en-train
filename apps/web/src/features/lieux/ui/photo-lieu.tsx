'use client';

// Photo d'un lieu (D100, D101, D103) : l'icône de la catégorie est là tout de suite, sur son fond ; la photo
// se pose par-dessus en fondu si elle arrive avant `photos.delaiMaxMs`, sinon l'icône reste. Jamais de
// carré vide qui attend. Le fondu suit `prefers-reduced-motion` (durées des jetons, globals.css).
import type { Categorie } from '@tourisme/commun';
import { Info } from 'lucide-react';
import { Popover } from 'radix-ui';
import { useEffect, useReducer, useRef } from 'react';
import { parametres } from '@/config/parametres';
import { cn } from '@/lib/classes';
import { etatSuivant, NOMS_SOURCES_PHOTO, texteCredit } from '../photo';
import type { Photo } from '../schemas';
import { APPARENCE_CATEGORIE, IconeCategorie } from './icone-categorie';

const { largeurPetitePx, largeurGrandePx, delaiMaxMs } = parametres.photos;

/** Largeur occupée à l'écran : le navigateur choisit la vignette (`sizes`). */
const TAILLES: Readonly<Record<'carte' | 'liste' | 'fiche' | 'vignette', string>> = {
  carte: '12rem',
  liste: '(min-width: 1024px) 20rem, 100vw',
  fiche: '(min-width: 1024px) 36rem, 100vw',
  vignette: '4rem',
};

export function PhotoLieu({
  photo,
  nom,
  categorie,
  format,
  className,
  classeIcone,
  surAffichage,
}: {
  photo: Photo | null;
  nom: string;
  categorie: Categorie;
  format: keyof typeof TAILLES;
  /** Taille et forme du cadre (hauteur, arrondi) : celles de l'emplacement qui le reçoit. */
  className?: string;
  classeIcone?: string;
  /** Prévenu quand la photo est vraiment à l'écran : son crédit ne s'affiche qu'alors (fiche lieu). */
  surAffichage?: (affichee: boolean) => void;
}) {
  const { classeFond, classeTexte } = APPARENCE_CATEGORIE[categorie];
  const [etat, envoyer] = useReducer(etatSuivant, 'attente');
  const cadre = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);

  // Image déjà chargée avant que React s'y attache (cache du navigateur) : affichée sans attendre.
  // La limite de temps ne court qu'une fois la photo à l'écran (chargement différé).
  useEffect(() => {
    if (!photo) return;
    if (image.current?.complete && image.current.naturalWidth > 0) envoyer('chargee');
    const element = cadre.current;
    if (!element) return;
    const observateur = new IntersectionObserver((entrees) => {
      if (entrees.some((e) => e.isIntersecting)) {
        envoyer('visible');
        observateur.disconnect();
      }
    });
    observateur.observe(element);
    return () => observateur.disconnect();
  }, [photo]);

  useEffect(() => {
    surAffichage?.(etat === 'affichee');
  }, [etat, surAffichage]);

  useEffect(() => {
    if (etat !== 'chargement') return;
    const minuteur = setTimeout(() => envoyer('delai'), delaiMaxMs);
    return () => clearTimeout(minuteur);
  }, [etat]);

  return (
    <div
      ref={cadre}
      data-photo-etat={photo ? etat : undefined}
      className={cn(
        'relative flex items-center justify-center overflow-hidden',
        classeFond,
        className,
      )}
    >
      <IconeCategorie categorie={categorie} className={cn(classeTexte, classeIcone)} />
      {photo && etat !== 'abandon' && (
        // `<img>` simple, vignettes de la source : `next/image` attend des mesures (D101, A-FAIRE § 3).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={image}
          src={photo.petite}
          srcSet={`${photo.petite} ${largeurPetitePx}w, ${photo.grande} ${largeurGrandePx}w`}
          sizes={TAILLES[format]}
          alt={nom}
          width={largeurGrandePx}
          height={Math.round((largeurGrandePx * 3) / 4)}
          loading={format === 'fiche' ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => envoyer('chargee')}
          onError={() => envoyer('erreur')}
          className={cn(
            'absolute inset-0 size-full object-cover opacity-0 motion-safe:transition-opacity',
            etat === 'affichee' && 'opacity-100',
          )}
        />
      )}
    </div>
  );
}

/** « Photo : auteur · licence · source », la licence et la source liées quand c'est possible (D101). */
export function LigneCreditPhoto({ photo, className }: { photo: Photo; className?: string }) {
  const lien = 'underline decoration-dotted underline-offset-2 hover:text-foreground';
  const nomSource = NOMS_SOURCES_PHOTO[photo.source];
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      Photo : {photo.auteur} ·{' '}
      {photo.licenceUrl ? (
        <a href={photo.licenceUrl} target="_blank" rel="noopener noreferrer" className={lien}>
          {photo.licence}
        </a>
      ) : (
        photo.licence
      )}{' '}
      ·{' '}
      {photo.page ? (
        <a href={photo.page} target="_blank" rel="noopener noreferrer" className={lien}>
          {nomSource}
        </a>
      ) : (
        nomSource
      )}
    </p>
  );
}

/**
 * ⓘ des petites cartes : zone de toucher de 44 px, pastille lisible sur une photo claire comme sombre
 * (fond de surface presque opaque, contour), dans les deux thèmes. Jamais dans un lien : c'est un frère du
 * lien de la carte, posé sur la photo.
 */
export function BoutonCreditPhoto({
  photo,
  className,
  alignement = 'end',
  surPhoto = false,
}: {
  photo: Photo;
  className?: string;
  /** Côté de la photo où se trouve le ⓘ : la bulle s'ouvre de ce côté. */
  alignement?: 'start' | 'end';
  /** Posé en haut de la photo de la fiche : rond sombre, comme le bouton Retour (maquette Fiche-Lieu). */
  surPhoto?: boolean;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Crédit de la photo"
          title={texteCredit(photo)}
          className={cn('flex size-11 items-center justify-center rounded-pill', className)}
        >
          <span
            className={cn(
              'flex items-center justify-center rounded-pill',
              surPhoto
                ? 'size-8 bg-sur-photo-bouton text-sur-photo-texte'
                : 'size-6 bg-surface/90 text-foreground shadow-xs ring-1 ring-border',
            )}
          >
            <Info aria-hidden="true" className={surPhoto ? 'size-4.5' : 'size-4'} />
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side={surPhoto ? 'bottom' : 'top'}
          align={alignement}
          sideOffset={2}
          collisionPadding={16}
          className="z-toast max-w-72 rounded-lg bg-surface-raised px-3 py-2 text-foreground shadow-float ring-1 ring-border"
        >
          <LigneCreditPhoto photo={photo} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
