// Commande `pnpm etl liaisons` (docs/04-traitement-donnees.md § 4.3, D040) : liaisons directes sur
// la fenêtre [aujourd'hui à Paris, + fenetreJoursLiaisons], depuis les horaires déjà en base.
// Aucun fichier téléchargé : toujours recalculé (la fenêtre avance chaque jour, ≈ 2 s).
import { dateDuJour } from '@tourisme/commun';
import { executerSource } from '../chargement/execution';
import { calculerLiaisons } from '../chargement/liaisons';
import { lireConfig, parametres, resoudreDossierDonnees } from '../config';
import { creerPool } from '../db';

export async function traiterLiaisons(): Promise<void> {
  const config = lireConfig();
  const dossierDonnees = resoudreDossierDonnees(config.DOSSIER_DONNEES);
  const pool = creerPool(config.BDD_URL_ETL);
  try {
    await executerSource({ pool, dossierDonnees }, 'liaisons', async (suivi) => {
      const fenetre = { debut: dateDuJour(), jours: parametres.fenetreJoursLiaisons };
      const bilan = await calculerLiaisons(pool, fenetre);
      suivi.chargees = bilan.liaisons;
      suivi.controles = bilan.controles;
      suivi.remarques.push(
        `Liaisons : ${bilan.liaisons.toLocaleString('fr-FR')} (fenêtre : ${fenetre.debut} + ${fenetre.jours} jours)`,
        ...bilan.constats,
      );
      return 'SUCCES';
    });
  } finally {
    await pool.end();
  }
}
