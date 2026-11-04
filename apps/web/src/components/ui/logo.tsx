// Seul endroit du logo (provisoire) : le remplacer ici le remplace partout. Couleurs : --logo*.
import { marque } from '@/config/marque';
import { cn } from '@/lib/classes';

type Proprietes = { surHero?: boolean; className?: string };

export function Logo({ surHero = false, className }: Proprietes) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 34 10"
        width="34"
        height="10"
        aria-hidden="true"
        className={surHero ? 'text-logo-sur-hero' : 'text-logo'}
      >
        <circle cx="5" cy="5" r="3.75" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <rect x="10" y="3.5" width="14" height="3" fill="currentColor" />
        <circle cx="29" cy="5" r="5" fill="currentColor" />
      </svg>
      <span
        className={cn(
          'font-display text-2xl font-bold tracking-tight',
          surHero ? 'text-hero-foreground' : 'text-foreground',
        )}
      >
        {marque.nom}
      </span>
    </span>
  );
}
