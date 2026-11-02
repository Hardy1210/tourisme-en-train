// Commande `pnpm etl rattachements` (docs/04-traitement-donnees.md § 4.6, D043) : doublons entre
// sources, sites, lieux à pied de chaque gare, statistiques par gare. Aucun fichier téléchargé :
// toujours recalculé depuis les lieux et les gares en base (quelques secondes).
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { lireDecisions } from '../chargement/decisions-doublons';
import { calculerRattachements } from '../chargement/rattachements';
import type { PaireRapport } from '../chargement/rattachements-rapports';
import { executerSource } from '../chargement/execution';
import { lireConfig, resoudreDossierDonnees } from '../config';
import { creerPool } from '../db';

const ENTETE =
  'source_garde;id_garde;nom_garde;source_doublon;id_doublon;nom_doublon;distance_m;similarite;decision';

/** Champ CSV entre guillemets (un nom de lieu peut contenir un point-virgule). */
const champ = (texte: string): string => `"${texte.replaceAll('"', '""')}"`;

/** Écrit `traite/rapports/<nom>.csv` (toujours réécrit) ; renvoie son chemin. */
export async function ecrirePaires(
  dossierDonnees: string,
  nom: string,
  paires: readonly PaireRapport[],
): Promise<string> {
  const dossier = path.join(dossierDonnees, 'traite', 'rapports');
  await mkdir(dossier, { recursive: true });
  const chemin = path.join(dossier, `${nom}.csv`);
  const lignes = paires.map((p) =>
    [
      p.source_garde,
      champ(p.id_garde),
      champ(p.nom_garde),
      p.source_doublon,
      champ(p.id_doublon),
      champ(p.nom_doublon),
      p.distance_m,
      p.similarite,
      p.decision,
    ].join(';'),
  );
  // Mêmes colonnes que regles/doublons_manuels.csv : une ligne se recopie telle quelle.
  await writeFile(chemin, [ENTETE, ...lignes].join('\n') + '\n');
  return chemin;
}

export async function traiterRattachements(): Promise<void> {
  const config = lireConfig();
  const dossierDonnees = resoudreDossierDonnees(config.DOSSIER_DONNEES);
  const pool = creerPool(config.BDD_URL_ETL);
  try {
    await executerSource({ pool, dossierDonnees }, 'rattachements', async (suivi) => {
      const bilan = await calculerRattachements(pool, await lireDecisions());
      suivi.chargees = bilan.lienGare;
      suivi.controles = bilan.controles;
      await ecrirePaires(dossierDonnees, 'doublons_fusionnes', bilan.fusions);
      await ecrirePaires(dossierDonnees, 'doublons_a_relire', bilan.aRelire);
      suivi.remarques.push(
        ...bilan.constats,
        `Paires fusionnées : traite/rapports/doublons_fusionnes.csv (${bilan.fusions.length})`,
        `Paires à relire, non fusionnées : traite/rapports/doublons_a_relire.csv (${bilan.aRelire.length}) ; décisions dans regles/doublons_manuels.csv`,
      );
      return 'SUCCES';
    });
  } finally {
    await pool.end();
  }
}
