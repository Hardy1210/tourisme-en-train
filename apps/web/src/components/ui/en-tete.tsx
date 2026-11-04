import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/classes';

type Proprietes = {
  /** En-tête plein, à la couleur de la marque (écran Lieux). */
  surHero?: boolean;
  /** À droite du logo (choix de la date). */
  action?: ReactNode;
  /** Contrôles propres à l'écran (position, filtres). */
  children?: ReactNode;
  className?: string;
};

export function EnTete({ surHero = false, action, children, className }: Proprietes) {
  return (
    <header
      className={cn(
        'sticky top-0 z-header flex flex-col gap-2 px-4 pt-1 pb-3 safe-top',
        surHero ? 'bg-hero-bg' : 'bg-background',
        className,
      )}
    >
      <div className="flex min-h-touch items-center justify-between gap-3">
        <Logo surHero={surHero} />
        {action}
      </div>
      {children}
    </header>
  );
}
