import type { ReactNode } from 'react';

/**
 * Pied des fiches (destination, lieu) : toujours visible en bas, sur la surface claire, haut arrondi comme les
 * feuilles d'Explorer (`--feuille-radius`) et leur ombre. Les marges sont celles du pied de la fiche
 * destination ; la hauteur suit le contenu (Hardy, 20/11).
 */
export function PiedFiche({ children }: { children: ReactNode }) {
  return (
    <footer className="flex flex-none flex-col gap-2 rounded-t-feuille bg-surface px-4 pt-2.5 pb-6 text-foreground shadow-sheet">
      {children}
    </footer>
  );
}
