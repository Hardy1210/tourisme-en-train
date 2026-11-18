/** Distance lisible en français : « 650 m », « 1,5 km ». */
export function formaterDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1).replace('.', ',')} km`;
}

/** Durée estimée (à pied, à vélo) : toujours précédée de « ≈ » (D102) : « ≈ 9 min ». */
export function formaterDureeEstimee(minutes: number): string {
  return `≈ ${minutes} min`;
}

/** Distance à vol d'oiseau, dite comme telle (D102) : « 2,9 km à vol d'oiseau ». */
export function formaterDistanceVolOiseau(metres: number): string {
  return `${formaterDistance(metres)} à vol d'oiseau`;
}
