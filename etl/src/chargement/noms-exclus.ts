// Lecture de `regles/noms_exclus.csv` (docs/04-traitement-donnees.md § 4.5, D045) et rapport des lieux
// écartés par leur nom, relu par Hardy.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { lireMotif, type MotifExclu } from '../transformations/noms-exclus';
import { lireCsv } from './base';

export const FICHIER_NOMS_EXCLUS = new URL('../regles/noms_exclus.csv', import.meta.url);

const schemaMotif = z.object({ motif: z.string().trim().min(2), raison: z.string().trim().min(1) });

/** Motifs du fichier ; une ligne illisible est une erreur (elle changerait les lieux en silence). */
export async function lireNomsExclus(
  chemin = fileURLToPath(FICHIER_NOMS_EXCLUS),
): Promise<MotifExclu[]> {
  const { lignes, bilan } = lireCsv(chemin, schemaMotif, { delimiteur: ';', commentaire: '#' });
  const motifs: MotifExclu[] = [];
  for await (const l of lignes) motifs.push(lireMotif(l.motif, l.raison));
  if (bilan.rejets.length > 0) {
    const detail = bilan.rejets.map((r) => `ligne ${r.ligne} : ${r.raison}`).join(' ; ');
    throw new Error(`Lignes illisibles dans regles/noms_exclus.csv : ${detail}`);
  }
  return motifs;
}

export interface LieuExclu {
  idSource: string;
  nom: string;
  motif: string;
  raison: string;
}

const champ = (texte: string): string => `"${texte.replaceAll('"', '""')}"`;

/** Écrit `traite/rapports/lieux_exclus_par_nom_<source>.csv` (toujours réécrit) ; renvoie son chemin. */
export async function ecrireLieuxExclus(
  dossierDonnees: string,
  source: string,
  lieux: readonly LieuExclu[],
): Promise<string> {
  const dossier = path.join(dossierDonnees, 'traite', 'rapports');
  await mkdir(dossier, { recursive: true });
  const chemin = path.join(dossier, `lieux_exclus_par_nom_${source}.csv`);
  const lignes = [...lieux]
    .sort((a, b) => a.raison.localeCompare(b.raison) || a.nom.localeCompare(b.nom))
    .map((l) => [source, champ(l.idSource), champ(l.nom), champ(l.motif), l.raison].join(';'));
  await writeFile(chemin, ['source;id_source;nom;motif;raison', ...lignes].join('\n') + '\n');
  return chemin;
}
