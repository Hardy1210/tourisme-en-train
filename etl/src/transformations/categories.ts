// Classement des lieux par les règles de `regles/categories.csv` (docs/04-traitement-donnees.md § 4.5,
// D041). Fonctions pures : les règles arrivent en paramètre (lues dans `categorie_regle`).
import type { Categorie, ConditionRegle } from '@tourisme/commun';

export interface RegleCategorie {
  cle: string;
  /** `*` = toute valeur de la clé. */
  valeur: string;
  /** null = lieu écarté. */
  categorie: Categorie | null;
  sousCategorie: string | null;
  priorite: number;
  /** OSM : null = nom obligatoire. Ignorée pour une règle d'exclusion. */
  condition: ConditionRegle | null;
}

/** Une étiquette d'un lieu : classe DATAtourisme (`categorie`, `Museum`) ou tag OSM (`leisure`, `park`). */
export type Etiquette = readonly [cle: string, valeur: string];

export interface IndexRegles {
  parEtiquette: ReadonlyMap<string, readonly RegleCategorie[]>;
  /** Clés des règles qui classent (catégorie non nulle) : une valeur de ces clés sans règle est « non classée ». */
  cles: ReadonlySet<string>;
}

export type Classement =
  | { type: 'classe'; categorie: Categorie; sousCategorie: string | null }
  /** Une règle d'exclusion l'emporte (hébergement, restauration…). */
  | { type: 'exclu' }
  /** Des règles de catégorie existent, mais aucune condition n'est remplie (nom, signe de sortie). */
  | { type: 'condition' }
  /** Aucune règle ne s'applique. */
  | { type: 'non_classe' };

const cleIndex = (cle: string, valeur: string): string => `${cle}=${valeur}`;

export function indexerRegles(regles: readonly RegleCategorie[]): IndexRegles {
  const parEtiquette = new Map<string, RegleCategorie[]>();
  for (const regle of regles) {
    const k = cleIndex(regle.cle, regle.valeur);
    parEtiquette.set(k, [...(parEtiquette.get(k) ?? []), regle]);
  }
  const cles = new Set(regles.filter((r) => r.categorie !== null).map((r) => r.cle));
  return { parEtiquette, cles };
}

function reglesDe(index: IndexRegles, [cle, valeur]: Etiquette): readonly RegleCategorie[] {
  return [
    ...(index.parEtiquette.get(cleIndex(cle, valeur)) ?? []),
    ...(index.parEtiquette.get(cleIndex(cle, '*')) ?? []),
  ];
}

function conditionRemplie(
  regle: RegleCategorie,
  lieu: { aNom: boolean; notable: boolean },
): boolean {
  if (regle.categorie === null) return true;
  if (regle.condition === 'sans_nom') return true;
  if (regle.condition === 'notable') return lieu.aNom && lieu.notable;
  return lieu.aNom;
}

/** Ordre : priorité la plus petite ; à égalité, l'exclusion d'abord ; puis la valeur (résultat stable). */
function avant(a: RegleCategorie, b: RegleCategorie): number {
  if (a.priorite !== b.priorite) return a.priorite - b.priorite;
  if ((a.categorie === null) !== (b.categorie === null)) return a.categorie === null ? -1 : 1;
  return cleIndex(a.cle, a.valeur).localeCompare(cleIndex(b.cle, b.valeur));
}

/** Meilleure règle parmi celles des étiquettes du lieu dont la condition est remplie. */
export function classer(
  index: IndexRegles,
  etiquettes: readonly Etiquette[],
  lieu: { aNom: boolean; notable: boolean },
): Classement {
  const applicables = etiquettes.flatMap((e) => reglesDe(index, e));
  if (applicables.length === 0) return { type: 'non_classe' };
  const retenue = applicables.filter((r) => conditionRemplie(r, lieu)).sort(avant)[0];
  if (!retenue) return { type: 'condition' };
  if (retenue.categorie === null) return { type: 'exclu' };
  return { type: 'classe', categorie: retenue.categorie, sousCategorie: retenue.sousCategorie };
}

/** Étiquettes d'une clé suivie qui n'ont aucune règle : à relire par Hardy (`04` § 4.5). */
export function etiquettesNonClassees(
  index: IndexRegles,
  etiquettes: readonly Etiquette[],
): string[] {
  return etiquettes
    .filter((e) => index.cles.has(e[0]) && reglesDe(index, e).length === 0)
    .map(([cle, valeur]) => cleIndex(cle, valeur));
}
