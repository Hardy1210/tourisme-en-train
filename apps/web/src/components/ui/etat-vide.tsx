import type { ReactNode } from 'react';
import { cn } from '@/lib/classes';

type Proprietes = {
  titre: string;
  texte: string;
  /** Mention au-dessus du titre (ex. « Aperçu · bientôt »). */
  mention?: ReactNode;
  /** Boutons proposés à l'utilisateur. */
  children?: ReactNode;
  className?: string;
};

/** Le seul état vide de l'application : dit ce qui se passe et ce que l'on peut faire. */
export function EtatVide({ titre, texte, mention, children, className }: Proprietes) {
  return (
    <div className={cn('flex flex-col items-start gap-3 rounded-2xl bg-surface p-5', className)}>
      {mention}
      <h2 className="text-xl font-bold">{titre}</h2>
      <p className="text-md text-pretty text-muted-foreground">{texte}</p>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
