// Lecture de `regles/corrections_manuelles.csv` (docs/04-traitement-donnees.md § 4.5, D061).
import { fileURLToPath } from 'node:url';
import { schemaCategorie } from '@tourisme/commun';
import { z } from 'zod';
import type { CorrectionLieu } from '../transformations/corrections';
import { lireCsv } from './base';

export const FICHIER_CORRECTIONS = new URL('../regles/corrections_manuelles.csv', import.meta.url);

const vide = (texte: string): string | null => (texte.trim() === '' ? null : texte.trim());

const schemaLigne = z
  .object({
    source: z.string().trim().min(1),
    id_source: z.string().trim().min(1),
    action: z.enum(['retirer', 'reclasser']),
    categorie: z.string().transform(vide).pipe(schemaCategorie.nullable()),
    sous_categorie: z.string().transform(vide),
    secondaire: z.union([z.enum(['', 'retirer']), schemaCategorie]),
    decision: z.enum(['', 'oui', 'non']),
  })
  .refine((l) => l.action !== 'reclasser' || l.categorie !== null, {
    message: 'Une ligne « reclasser » doit donner une catégorie.',
  });

/** Corrections validées (« oui ») ; une ligne illisible est une erreur, jamais ignorée en silence. */
export async function lireCorrections(
  chemin = fileURLToPath(FICHIER_CORRECTIONS),
): Promise<CorrectionLieu[]> {
  const { lignes, bilan } = lireCsv(chemin, schemaLigne, { delimiteur: ';', commentaire: '#' });
  const corrections: CorrectionLieu[] = [];
  for await (const l of lignes) {
    if (l.decision !== 'oui') continue;
    corrections.push({
      source: l.source,
      idSource: l.id_source,
      action: l.action,
      categorie: l.categorie,
      sousCategorie: l.sous_categorie,
      secondaires: l.secondaire === '' ? null : l.secondaire === 'retirer' ? [] : [l.secondaire],
    });
  }
  if (bilan.rejets.length > 0) {
    const detail = bilan.rejets.map((r) => `ligne ${r.ligne} : ${r.raison}`).join(' ; ');
    throw new Error(`Lignes illisibles dans regles/corrections_manuelles.csv : ${detail}`);
  }
  return corrections;
}
