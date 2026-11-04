// Correspondance catégorie → icône Lucide + tokens de couleur (docs/06-interface.md § 2).
import type { Categorie } from '@tourisme/commun';
import { Castle, FerrisWheel, Mountain, Theater, Trees, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/classes';

type Apparence = { Icone: LucideIcon; libelle: string; classeTexte: string; classeFond: string };

// Classes écrites en entier : Tailwind ne détecte pas un nom construit à l'exécution.
export const APPARENCE_CATEGORIE: Record<Categorie, Apparence> = {
  enfants: {
    Icone: FerrisWheel,
    libelle: 'Enfants',
    classeTexte: 'text-cat-enfants-foreground',
    classeFond: 'bg-cat-enfants-soft',
  },
  nature: {
    Icone: Mountain,
    libelle: 'Nature',
    classeTexte: 'text-cat-nature-foreground',
    classeFond: 'bg-cat-nature-soft',
  },
  parcs: {
    Icone: Trees,
    libelle: 'Parcs',
    classeTexte: 'text-cat-parcs-foreground',
    classeFond: 'bg-cat-parcs-soft',
  },
  patrimoine: {
    Icone: Castle,
    libelle: 'Patrimoine',
    classeTexte: 'text-cat-patrimoine-foreground',
    classeFond: 'bg-cat-patrimoine-soft',
  },
  culture: {
    Icone: Theater,
    libelle: 'Culture',
    classeTexte: 'text-cat-culture-foreground',
    classeFond: 'bg-cat-culture-soft',
  },
};

type Proprietes = {
  categorie: Categorie;
  className?: string;
  /** Icône seule, sans texte à côté : le lecteur d'écran annonce le nom de la catégorie. */
  annoncee?: boolean;
};

export function IconeCategorie({ categorie, className, annoncee = false }: Proprietes) {
  const { Icone, libelle, classeTexte } = APPARENCE_CATEGORIE[categorie];
  return (
    <Icone
      className={cn(classeTexte, className)}
      {...(annoncee ? { role: 'img', 'aria-label': libelle } : { 'aria-hidden': true })}
    />
  );
}
