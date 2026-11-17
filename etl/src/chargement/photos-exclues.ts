// Lecture de `regles/photos_exclues.csv` (docs/04-traitement-donnees.md § 4.6 bis, D101) : photos écartées
// à la main, désignées par leur fichier Commons ou leur adresse DATAtourisme. Le lieu n'est jamais touché.
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { lireCsv } from './base';

export const FICHIER_PHOTOS_EXCLUES = new URL('../regles/photos_exclues.csv', import.meta.url);

const schemaLigne = z.object({
  photo: z.string().trim().min(3),
  raison: z.string().trim().min(1),
  decision: z.string().trim().default(''),
});

/** Photos décidées « oui » ; une ligne illisible est une erreur (elle changerait les photos en silence). */
export async function lirePhotosExclues(
  chemin = fileURLToPath(FICHIER_PHOTOS_EXCLUES),
): Promise<Set<string>> {
  const { lignes, bilan } = lireCsv(chemin, schemaLigne, { delimiteur: ';', commentaire: '#' });
  const exclues = new Set<string>();
  for await (const l of lignes) if (l.decision.toLowerCase() === 'oui') exclues.add(l.photo);
  if (bilan.rejets.length > 0) {
    const detail = bilan.rejets.map((r) => `ligne ${r.ligne} : ${r.raison}`).join(' ; ');
    throw new Error(`Lignes illisibles dans regles/photos_exclues.csv : ${detail}`);
  }
  return exclues;
}
