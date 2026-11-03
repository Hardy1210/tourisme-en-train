// Regroupement des gares d'arrivée par ville, gare en tête, exclusions et tri (D047, docs/05-api.md § 3.4).
// Logique pure, testée sans base : la requête fournit une ligne par gare d'arrivée.

/** Ce que le regroupement a besoin de savoir d'une gare d'arrivée. */
export type GareAtteinte = {
  gareId: number;
  /** Clé de la commune de rattachement (nom + département) ; `gare:<id>` si la commune est inconnue. */
  cleVille: string;
  dansRegion: boolean;
  dureeMin: number;
  nbTrains: number;
  /** Lieux à pied de la gare, catégories demandées seulement. */
  nbLieux: number;
};

export type Regroupement<T extends GareAtteinte> = { tete: T; autres: T[]; sansLieu: boolean };

/** Gare en tête : le plus de trains ; à égalité, la plus rapide ; puis l'identifiant (ordre stable). */
function avantDansLaVille(a: GareAtteinte, b: GareAtteinte): number {
  return b.nbTrains - a.nbTrains || a.dureeMin - b.dureeMin || a.gareId - b.gareId;
}

export function regrouperParVille<T extends GareAtteinte>(
  gares: readonly T[],
  options: { cleVilleDepart: string | null; filtreEnvies: boolean; limite: number },
): Regroupement<T>[] {
  const parVille = new Map<string, T[]>();
  for (const gare of gares) {
    if (options.cleVilleDepart !== null && gare.cleVille === options.cleVilleDepart) continue;
    const ville = parVille.get(gare.cleVille);
    if (ville) ville.push(gare);
    else parVille.set(gare.cleVille, [gare]);
  }

  const regroupements: Regroupement<T>[] = [];
  for (const ville of parVille.values()) {
    const [tete, ...autres] = ville.sort(avantDansLaVille);
    if (!tete) continue;
    const sansLieu = tete.dansRegion && tete.nbLieux === 0;
    // Filtre des envies : une destination de la région sans lieu des catégories choisies est retirée ;
    // hors région, elle reste (« trains seulement »).
    if (sansLieu && options.filtreEnvies) continue;
    regroupements.push({ tete, autres, sansLieu });
  }

  return regroupements
    .sort(
      (a, b) =>
        Number(a.sansLieu) - Number(b.sansLieu) ||
        a.tete.dureeMin - b.tete.dureeMin ||
        a.tete.gareId - b.tete.gareId,
    )
    .slice(0, options.limite);
}
