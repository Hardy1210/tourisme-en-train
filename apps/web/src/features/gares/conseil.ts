// Gare de départ proposée par défaut (D064) : calculs purs.

type Candidate = { uic: string; distanceM: number; dansRegion: boolean; nbTrainsJour: number };

/**
 * Dans le rayon et la région, la gare qui a le plus de trains ; à égalité, la plus proche.
 * Sinon, ou s'il n'y a aucun train, la plus proche : `gares` est trié par distance.
 */
export function gareConseillee<G extends Candidate>(gares: readonly G[], rayonM: number): G | null {
  const dansLeRayon = gares.filter((g) => g.dansRegion && g.distanceM <= rayonM);
  let meilleure: G | null = null;
  for (const gare of dansLeRayon) {
    if (gare.nbTrainsJour > (meilleure?.nbTrainsJour ?? 0)) meilleure = gare;
  }
  return meilleure ?? gares[0] ?? null;
}

/** Les plus proches, dans l'ordre ; la gare conseillée prend la dernière place si elle en est absente. */
export function garesAProposer<G extends { uic: string }>(
  gares: readonly G[],
  conseillee: G | null,
  limite: number,
): G[] {
  const proposees = gares.slice(0, limite);
  if (conseillee && !proposees.some((g) => g.uic === conseillee.uic)) {
    proposees[proposees.length - 1] = conseillee;
  }
  return proposees;
}
