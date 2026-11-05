// Gare de départ proposée par défaut (D064) : calculs purs.

type Candidate = {
  uic: string;
  distanceM: number;
  dansRegion: boolean;
  /** Somme des trains de chaque destination : un train est compté une fois par arrêt desservi. */
  trainsParDestination: number;
  /** Codes UIC des gares desservies en direct, le même jour pour toutes les candidates. */
  destinations: readonly string[];
};

/** La gare dessert toutes les destinations de la référence, sauf elle-même, qu'on ne peut pas perdre. */
function couvre(gare: Candidate, reference: Candidate): boolean {
  const desservies = new Set(gare.destinations);
  return reference.destinations.every((uic) => uic === gare.uic || desservies.has(uic));
}

type Limites = { distanceMaxM: number; ratioTrainsMin: number };

/**
 * La plus proche, sauf si une gare de la région rejoignable à pied a assez de trains en plus et
 * dessert au moins toutes ses destinations ; à égalité, la plus proche. `gares` est trié par distance.
 * Hors région, la plus proche n'affiche aucune destination : il n'y a rien à préserver.
 */
export function gareConseillee<G extends Candidate>(
  gares: readonly G[],
  { distanceMaxM, ratioTrainsMin }: Limites,
): G | null {
  const plusProche = gares[0];
  if (!plusProche) return null;
  let meilleure: G | null = plusProche.dansRegion ? plusProche : null;
  for (const gare of gares) {
    if (!gare.dansRegion || gare.distanceM > distanceMaxM) continue;
    if (plusProche.dansRegion) {
      const assezDeTrains =
        gare.trainsParDestination >= plusProche.trainsParDestination * ratioTrainsMin;
      if (!assezDeTrains || !couvre(gare, plusProche)) continue;
    }
    if (gare.trainsParDestination > (meilleure?.trainsParDestination ?? 0)) meilleure = gare;
  }
  return meilleure ?? plusProche;
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
