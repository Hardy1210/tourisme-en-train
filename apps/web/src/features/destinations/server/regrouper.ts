// Regroupement des gares d'arrivée en destinations, gare en tête, exclusions et tri
// (D047, D049, D050, docs/05-api.md § 3.4). Logique pure, testée sans base.

/** Ce que le regroupement a besoin de savoir d'une gare d'arrivée. */
export type GareAtteinte = {
  gareId: number;
  /**
   * Clé de la destination : commune de rattachement (nom + département) ; `gare:<id>` pour une gare
   * hors de la ville (gare TGV, D049) ou dont la commune est inconnue.
   */
  cleDestination: string;
  /** Clé de la commune (nom + département), null si inconnue : exclusion de la commune de départ. */
  cleCommune: string | null;
  dansRegion: boolean;
  dureeMin: number;
  nbTrains: number;
  /** Lieux à pied de la gare, catégories demandées seulement. */
  nbLieux: number;
};

export type Regroupement<T extends GareAtteinte> = { tete: T; autres: T[]; peuDeLieux: boolean };

export type OptionsRegroupement = {
  cleCommuneDepart: string | null;
  /** Des catégories ont été choisies (filtre des envies). */
  filtreEnvies: boolean;
  /** `destinations.lieuxMinEnTete` (D050). */
  lieuxMinEnTete: number;
  limite: number;
};

/**
 * Gare hors de la ville (D049) : son nom contient le mot `mot` (« TGV »), en mot entier.
 * Une règle, pas une liste : elle vaut pour toute région sans entretien.
 */
export function estHorsVille(nomGare: string, mot: string): boolean {
  return new RegExp(`(^|[^\\p{L}])${mot}($|[^\\p{L}])`, 'u').test(nomGare);
}

/** Clé de destination : la gare seule si elle est hors de la ville ou sans commune, sinon sa commune. */
export function cleDestination(gare: {
  gareId: number;
  nom: string;
  cleCommune: string | null;
  motHorsVille: string;
}): string {
  return gare.cleCommune === null || estHorsVille(gare.nom, gare.motHorsVille)
    ? `gare:${gare.gareId}`
    : gare.cleCommune;
}

/** Gare en tête : le plus de trains ; à égalité, la plus rapide ; puis l'identifiant (ordre stable). */
function avantDansLaVille(a: GareAtteinte, b: GareAtteinte): number {
  return b.nbTrains - a.nbTrains || a.dureeMin - b.dureeMin || a.gareId - b.gareId;
}

export function regrouperParVille<T extends GareAtteinte>(
  gares: readonly T[],
  options: OptionsRegroupement,
): Regroupement<T>[] {
  const parDestination = new Map<string, T[]>();
  for (const gare of gares) {
    // Même commune que le départ : exclue, gare TGV comprise (D047).
    if (options.cleCommuneDepart !== null && gare.cleCommune === options.cleCommuneDepart) continue;
    const groupe = parDestination.get(gare.cleDestination);
    if (groupe) groupe.push(gare);
    else parDestination.set(gare.cleDestination, [gare]);
  }

  const regroupements: Regroupement<T>[] = [];
  for (const groupe of parDestination.values()) {
    const [tete, ...autres] = groupe.sort(avantDansLaVille);
    if (!tete) continue;
    // Hors région, les lieux ne sont pas chargés : ni retirée, ni en fin de liste (« trains seulement »).
    if (tete.dansRegion && tete.nbLieux === 0 && options.filtreEnvies) continue;
    const peuDeLieux = tete.dansRegion && tete.nbLieux < options.lieuxMinEnTete;
    regroupements.push({ tete, autres, peuDeLieux });
  }

  return regroupements
    .sort(
      (a, b) =>
        Number(a.peuDeLieux) - Number(b.peuDeLieux) ||
        a.tete.dureeMin - b.tete.dureeMin ||
        a.tete.gareId - b.tete.gareId,
    )
    .slice(0, options.limite);
}

/** Nom de la carte : la commune ; le nom de la gare si elle est hors de la ville ou sans commune (D049). */
export function titreDestination(
  nomGare: string,
  commune: string | null,
  horsVille: boolean,
): string {
  return horsVille || commune === null ? nomGare : commune;
}
