// Adresse de la fiche d'une destination, depuis une gare de départ et la date choisie (aucune position, D058).
import type { ContexteTrajet } from '@/features/lieux/liens';

export function lienDestination(uic: string, trajet: ContexteTrajet): string {
  const suite = new URLSearchParams({ depuis: trajet.depuis });
  if (trajet.date !== null) suite.set('date', trajet.date);
  return `/destinations/${encodeURIComponent(uic)}?${suite.toString()}`;
}
