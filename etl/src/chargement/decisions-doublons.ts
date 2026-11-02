// Décisions manuelles sur les doublons (docs/04-traitement-donnees.md § 4.6, D044) :
// `regles/doublons_manuels.csv` (versionné, rempli par Hardy) → table temporaire `tmp_decision`.
// « oui » fusionne une paire, « non » l'empêche toujours ; une décision vide est ignorée.
import { fileURLToPath } from 'node:url';
import type pg from 'pg';
import { z } from 'zod';
import { lireCsv, type BilanLecture } from './base';

export const FICHIER_DECISIONS = new URL('../regles/doublons_manuels.csv', import.meta.url);

export const schemaDecision = z.object({
  source_garde: z.string().min(1),
  id_garde: z.string().min(1),
  source_doublon: z.string().min(1),
  id_doublon: z.string().min(1),
  decision: z.enum(['oui', 'non', ''], { message: 'decision : oui, non ou vide' }),
});
export type Decision = z.infer<typeof schemaDecision> & { decision: 'oui' | 'non' };

export interface DecisionsLues {
  decisions: Decision[];
  /** Lignes illisibles : bloquant, une décision mal écrite changerait les fusions en silence. */
  rejets: BilanLecture['rejets'];
}

const estDecidee = (d: z.infer<typeof schemaDecision>): d is Decision => d.decision !== '';

export async function lireDecisions(
  chemin = fileURLToPath(FICHIER_DECISIONS),
): Promise<DecisionsLues> {
  const { lignes, bilan } = lireCsv(chemin, schemaDecision, { delimiteur: ';', commentaire: '#' });
  const decisions: Decision[] = [];
  for await (const ligne of lignes) if (estDecidee(ligne)) decisions.push(ligne);
  return { decisions, rejets: bilan.rejets };
}

/** Crée `tmp_decision` et y écrit les décisions (dans la transaction de `client`). */
export async function poserDecisions(
  client: pg.ClientBase,
  decisions: readonly Decision[],
): Promise<void> {
  await client.query(`CREATE TEMP TABLE tmp_decision (source_garde text, id_garde text,
    source_doublon text, id_doublon text, decision text) ON COMMIT DROP`);
  for (const d of decisions) {
    await client.query('INSERT INTO tmp_decision VALUES ($1, $2, $3, $4, $5)', [
      d.source_garde,
      d.id_garde,
      d.source_doublon,
      d.id_doublon,
      d.decision,
    ]);
  }
}
