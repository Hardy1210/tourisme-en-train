// Source `communes` : Code officiel géographique de l'INSEE (docs/02-sources-donnees.md § 2.1 bis).
// Aucune table : sert à donner `gare.commune` à partir du code INSEE pendant le chargement des gares.
import { z } from 'zod';
import { lireCsv, type BilanLecture } from '../chargement/base';

const schemaCommune = z.object({
  /** COM commune · ARM arrondissement municipal · COMD commune déléguée · COMA commune associée. */
  TYPECOM: z.enum(['COM', 'ARM', 'COMD', 'COMA']),
  COM: z.string().regex(/^(\d{5}|2[AB]\d{3})$/),
  LIBELLE: z.string().min(1),
  /** Commune de rattachement d'un ARM/COMD/COMA ; vide pour une COM. */
  COMPARENT: z.string(),
});

export type LigneCommune = z.infer<typeof schemaCommune>;

/**
 * Index « code INSEE → nom de commune ». Un ARM, une COMD ou une COMA prend le nom de sa commune
 * de rattachement (Paris 13ᵉ → Paris). Une COM l'emporte toujours : 584 communes déléguées
 * partagent le code de leur commune (COG 2026).
 */
export function indexerCommunes(lignes: Iterable<LigneCommune>): Map<string, string> {
  const noms = new Map<string, string>();
  const rattachees: LigneCommune[] = [];
  for (const ligne of lignes) {
    if (ligne.TYPECOM === 'COM') noms.set(ligne.COM, ligne.LIBELLE);
    else rattachees.push(ligne);
  }
  for (const { COM, COMPARENT } of rattachees) {
    const parent = noms.get(COMPARENT);
    if (!noms.has(COM) && parent) noms.set(COM, parent);
  }
  return noms;
}

/** Lit le fichier du COG (~37 500 lignes) et renvoie l'index, avec le bilan de lecture. */
export async function lireCommunes(
  chemin: string,
): Promise<{ communes: Map<string, string>; bilan: BilanLecture }> {
  const { lignes, bilan } = lireCsv(chemin, schemaCommune, { delimiteur: ',' });
  const toutes: LigneCommune[] = [];
  for await (const ligne of lignes) toutes.push(ligne);
  return { communes: indexerCommunes(toutes), bilan };
}
