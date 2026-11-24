// Seul endroit du logo (provisoire, changé après la soutenance) : le remplacer ici le remplace partout.
// Aujourd'hui un logo en texte : le nom de la marque, sa dernière lettre en couleur (--logo*), tiré de
// config/marque.ts, jamais écrit ici (règle 2). Pour une image (SVG ou PNG), remplacer le contenu de ce
// composant en gardant ses propriétés et son nom accessible : aucun écran n'aura à changer.
import { marque } from '@/config/marque';
import { cn } from '@/lib/classes';

type Proprietes = {
  surHero?: boolean;
  /** « grande » : écran de lancement (D112). */
  taille?: 'normale' | 'grande';
  className?: string;
};

export function Logo({ surHero = false, taille = 'normale', className }: Proprietes) {
  return (
    // Un seul nom pour les lecteurs d'écran : « Wagoo », pas « Wago o ».
    <span
      role="img"
      aria-label={marque.nom}
      className={cn(
        'font-display leading-none font-extrabold tracking-tight',
        taille === 'grande' ? 'text-logo-lancement' : 'text-2xl',
        surHero ? 'text-hero-foreground' : 'text-foreground',
        className,
      )}
    >
      {marque.nom.slice(0, -1)}
      <span className={surHero ? 'text-logo-sur-hero' : 'text-logo'}>{marque.nom.slice(-1)}</span>
    </span>
  );
}
