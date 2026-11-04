/** Distance lisible en français : « 650 m », « 1,5 km ». */
export function formaterDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1).replace('.', ',')} km`;
}
