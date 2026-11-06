// Géométrie de la carte : fonctions pures.
export type Point = { lat: number; lon: number };

/** Sud-ouest et nord-est contenant tous les points, au format de MapLibre ; null sans point. */
export function empriseDe(points: readonly Point[]): [[number, number], [number, number]] | null {
  if (points.length === 0) return null;
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ];
}

/** Une ligne d'arrêt en arrêt, dans l'ordre du train (D074) ; rien sous deux arrêts. */
export function ligneArrets(arrets: readonly Point[]) {
  return {
    type: 'FeatureCollection' as const,
    features:
      arrets.length < 2
        ? []
        : [
            {
              type: 'Feature' as const,
              properties: {},
              geometry: {
                type: 'LineString' as const,
                coordinates: arrets.map((arret) => [arret.lon, arret.lat]),
              },
            },
          ],
  };
}

/** Segments droits de la gare de départ vers chaque destination (P0, `06` § 3). */
export function segmentsDepuis(depart: Point, arrivees: readonly Point[]) {
  return {
    type: 'FeatureCollection' as const,
    features: arrivees.map((arrivee) => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [depart.lon, depart.lat],
          [arrivee.lon, arrivee.lat],
        ],
      },
    })),
  };
}

/** Étiquettes : les `nombre` destinations avec le plus de trains (la plus rapide à égalité), plus la sélectionnée. */
export function clesEtiquetees(
  destinations: readonly { uic: string; nbTrains: number; dureeMin: number }[],
  selection: string | null,
  nombre: number,
): Set<string> {
  const retenues = [...destinations]
    .sort((a, b) => b.nbTrains - a.nbTrains || a.dureeMin - b.dureeMin)
    .slice(0, nombre);
  const cles = new Set(retenues.map((d) => d.uic));
  if (selection !== null) cles.add(selection);
  return cles;
}

/**
 * Points du premier cadrage : le départ et les destinations proches. S'il y en a trop peu
 * (moins de `minimum`), toutes les destinations, pour que la carte montre quelque chose.
 */
export function pointsCadrage<D extends Point & { dureeMin: number }>(
  depart: Point,
  destinations: readonly D[],
  dureeMax: number,
  minimum = 3,
): Point[] {
  const proches = destinations.filter((d) => d.dureeMin <= dureeMax);
  return [depart, ...(proches.length >= minimum ? proches : destinations)];
}

/** Étiquettes « Beaune 22 min » : un point par destination étiquetée ; MapLibre gère les collisions. */
export function pointsEtiquettes(
  destinations: readonly (Point & { uic: string; etiquette: string })[],
  cles: ReadonlySet<string>,
  selection: string | null,
) {
  return {
    type: 'FeatureCollection' as const,
    features: destinations
      .filter((d) => cles.has(d.uic))
      .map((d) => ({
        type: 'Feature' as const,
        properties: { etiquette: d.etiquette, priorite: d.uic === selection ? 0 : 1 },
        geometry: { type: 'Point' as const, coordinates: [d.lon, d.lat] },
      })),
  };
}
