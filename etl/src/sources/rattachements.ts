// Commande `pnpm etl rattachements` (docs/04-traitement-donnees.md § 4.6, D043) : doublons entre
// sources, sites, lieux à pied de chaque gare, statistiques par gare. Aucun fichier téléchargé :
// toujours recalculé depuis les lieux et les gares en base (quelques secondes).
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { calculerRattachements, type PaireRapport } from '../chargement/rattachements';
import { executerSource } from '../chargement/execution';
import { lireConfig, resoudreDossierDonnees } from '../config';
import { creerPool } from '../db';

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
  const lignes = paires.map(
    (p) => `${champ(p.garde)};${champ(p.doublon)};${p.distance_m};${p.similarite}`,
  );
  await writeFile(chemin, ['garde;doublon;distance_m;similarite', ...lignes].join('\n') + '\n');
  return chemin;
}

export async function traiterRattachements(): Promise<void> {
  const config = lireConfig();
  const dossierDonnees = resoudreDossierDonnees(config.DOSSIER_DONNEES);
  const pool = creerPool(config.BDD_URL_ETL);
  try {
    await executerSource({ pool, dossierDonnees }, 'rattachements', async (suivi) => {
      const bilan = await calculerRattachements(pool);
      suivi.chargees = bilan.lienGare;
      suivi.controles = bilan.controles;
      await ecrirePaires(dossierDonnees, 'doublons_fusionnes', bilan.fusions);
      await ecrirePaires(dossierDonnees, 'doublons_a_relire', bilan.aRelire);
      suivi.remarques.push(
        ...bilan.constats,
        `Paires fusionnées : traite/rapports/doublons_fusionnes.csv (${bilan.fusions.length})`,
        `Paires à relire, non fusionnées : traite/rapports/doublons_a_relire.csv (${bilan.aRelire.length})`,
      );
      return 'SUCCES';
    });
  } finally {
    await pool.end();
  }
}
