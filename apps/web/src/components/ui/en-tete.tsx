import type { ReactNode, Ref } from 'react';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/classes';

type Proprietes = {
  /** En-tête plein, à la couleur de la marque (écran Lieux). */
  surHero?: boolean;
  /** Mobile : posé sur la carte, sans fond ; on peut déplacer la carte entre ses boutons (D072). */
  flottant?: boolean;
  ref?: Ref<HTMLElement>;
  /** Contrôles propres à l'écran (position, filtres). */
  children?: ReactNode;
  className?: string;
};

export function EnTete({
  surHero = false,
  flottant = false,
  ref,
  children,
  className,
}: Proprietes) {
  return (
    <header
      ref={ref}
      className={cn(
        'sticky top-0 z-header flex flex-col gap-2 px-4 pt-1 pb-3 safe-top',
        surHero ? 'bg-hero-bg' : 'bg-background',
        flottant &&
          'pointer-events-none bg-transparent lg:pointer-events-auto lg:bg-background [&>*]:pointer-events-auto',
        className,
      )}
    >
      {/* Logo sur ordinateur seulement : sur téléphone, l'en-tête garde le trajet et les filtres. */}
      <div className="hidden min-h-touch items-center lg:flex">
        <Logo surHero={surHero} />
      </div>
      {children}
    </header>
  );
}
