import type { CSSProperties } from 'react';
import type { ZoneVisible } from '@/lib/use-zone-visible';

/**
 * Où se tient la page plein écran quand le clavier est ouvert. Le fond ne bouge jamais : iOS annonce la
 * hauteur finale du clavier dès le début de sa montée, et un fond raccourci laisserait voir l'écran du
 * dessous jusqu'à son arrivée. Seul le contenu se cale sur la zone visible, au-dessus du clavier.
 */
export function placementPage(zone: ZoneVisible | null): {
  fond: CSSProperties;
  contenu: CSSProperties;
} {
  if (!zone) return { fond: {}, contenu: {} };
  return { fond: {}, contenu: { transform: `translateY(${zone.haut}px)`, height: zone.hauteur } };
}
