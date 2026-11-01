// Commande `pnpm etl regles` (docs/04-traitement-donnees.md § 4.5, D041) : recharge
// `regles/categories.csv` dans `categorie_regle`. Fichier du dépôt, rien à télécharger :
// toujours rechargé (≈ 300 lignes), avant `datatourisme` et `osm`.
import { fileURLToPath } from 'node:url';
import { charger, lireCsv } from '../chargement/base';
import { executerSource } from '../chargement/execution';
import {
  CONTROLES,
  FICHIER_REGLES,
  remplacerRegles,
  schemaRegle,
  TABLE_TEMPORAIRE,
  versValeurs,
} from '../chargement/regles';
import { lireConfig, resoudreDossierDonnees } from '../config';
import { creerPool } from '../db';
import { empreinteFichier } from './base';

export async function traiterRegles(): Promise<void> {
  const config = lireConfig();
  const dossierDonnees = resoudreDossierDonnees(config.DOSSIER_DONNEES);
  const pool = creerPool(config.BDD_URL_ETL);
  try {
    await executerSource({ pool, dossierDonnees }, 'regles', async (suivi) => {
      const chemin = fileURLToPath(FICHIER_REGLES);
      const { lignes, bilan } = lireCsv(chemin, schemaRegle, { delimiteur: ';', commentaire: '#' });
      suivi.lecture = bilan;
      // Une règle illisible changerait le classement en silence : tout le fichier doit être valide.
      const resultat = await charger(
        pool,
        {
          source: 'regles',
          tableTemporaire: TABLE_TEMPORAIRE,
          lignes,
          versValeurs,
          controles: [
            {
              nom: 'Lignes illisibles dans categories.csv',
              bloquant: true,
              verifier: async () => ({
                reussi: bilan.rejets.length === 0,
                detail: String(bilan.rejets.length),
              }),
            },
            ...CONTROLES,
          ],
          fusionner: remplacerRegles,
        },
        await empreinteFichier(chemin),
      );
      suivi.chargees = resultat.chargees;
      suivi.controles = resultat.controles;
      return 'SUCCES';
    });
  } finally {
    await pool.end();
  }
}
