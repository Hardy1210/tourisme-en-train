import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Les tokens propres au projet (globals.css) : sinon `text-md` passerait pour une couleur
// et ferait disparaître `text-foreground`.
const fusionner = extendTailwindMerge({
  extend: {
    theme: {
      text: ['2xs', 'md'],
      radius: ['pill'],
      shadow: ['card', 'float', 'sheet'],
    },
    classGroups: {
      z: [{ z: ['map', 'sheet', 'header', 'overlay', 'toast'] }],
    },
  },
});

/** Assemble des classes Tailwind ; en cas de conflit, la dernière l'emporte. */
export function cn(...classes: ClassValue[]): string {
  return fusionner(clsx(classes));
}
