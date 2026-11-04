// Lecture de `regles/categories_secondaires.csv` (docs/04-traitement-donnees.md § 4.5, D060).
import { fileURLToPath } from 'node:url';
import { schemaCategorie } from '@tourisme/commun';
import { z } from 'zod';
import type { RegleSecondaire } from '../transformations/categories-secondaires';
import { lireCsv } from './base';

export const FICHIER_SECONDAIRES = new URL('../regles/categories_secondaires.csv', import.meta.url);

const schemaRegle = z.object({
  source: z.enum(['datatourisme', 'osm', 'nom']),
  cle: z.string().trim(),
  valeur: z.string().trim().min(1),
  categorie: schemaCategorie,
});

/** Règles du fichier ; une ligne illisible est une erreur (elle changerait les lieux en silence). */
export async function lireReglesSecondaires(
  chemin = fileURLToPath(FICHIER_SECONDAIRES),
): Promise<RegleSecondaire[]> {
  const { lignes, bilan } = lireCsv(chemin, schemaRegle, { delimiteur: ';', commentaire: '#' });
  const regles: RegleSecondaire[] = [];
  for await (const l of lignes) regles.push(l);
  if (bilan.rejets.length > 0) {
    const detail = bilan.rejets.map((r) => `ligne ${r.ligne} : ${r.raison}`).join(' ; ');
    throw new Error(`Lignes illisibles dans regles/categories_secondaires.csv : ${detail}`);
  }
  return regles;
}
