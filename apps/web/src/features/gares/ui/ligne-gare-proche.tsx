import type { GareProche } from '../schemas';
import { accesGareProche } from '../acces-gare';

/**
 * Nom et accès d'une gare dans les listes de gares proches (page « Trajet », choix de la gare). La durée à
 * vélo ne s'affiche qu'avec sa preuve, « Parking vélo à la gare », juste sous le nom, et la distance sous la
 * durée (D097).
 */
export function LigneGareProche({
  gare,
}: {
  gare: Pick<GareProche, 'nom' | 'distanceM' | 'parkingVelo'>;
}) {
  const { texte, distance, aVelo } = accesGareProche(gare.distanceM, gare.parkingVelo);
  return (
    <>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-base font-medium">{gare.nom}</span>
        {aVelo && <span className="text-sm text-muted-foreground">Parking vélo à la gare</span>}
      </span>
      {/* À vélo, la distance en dessous, en plus petit : comme la preuve sous le nom, sans élargir la ligne. */}
      <span className="tabular flex flex-col items-end whitespace-nowrap text-muted-foreground">
        <span className="text-sm">{texte}</span>
        {distance !== null && <span className="text-xs">{distance}</span>}
      </span>
    </>
  );
}
