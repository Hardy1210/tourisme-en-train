// Configuration du traitement des données : variables d'environnement (validées par Zod)
// et paramètres métier (schéma unique de @tourisme/commun, jamais revalidés ici).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export { parametres } from '@tourisme/commun';

/** Racine du dépôt : là où se trouvent `.env` et `data/`. */
const RACINE_DEPOT = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Un `DOSSIER_DONNEES` relatif (`./data` dans `.env`) se lit depuis la racine du dépôt,
 * pas depuis `etl/` où `pnpm --filter` lance le traitement. Absolu (`/data` dans Docker) : inchangé.
 */
export function resoudreDossierDonnees(dossier: string, racine: string = RACINE_DEPOT): string {
  return path.resolve(racine, dossier);
}

const schemaEnv = z.object({
  BDD_URL_ETL: z.url({ protocol: /^postgres(ql)?$/ }),
  DOSSIER_DONNEES: z.string().min(1),
});

export type ConfigEtl = z.infer<typeof schemaEnv>;

/** Lue seulement au moment d'exécuter un traitement : `--help` fonctionne sans variables. */
export function lireConfig(variables: NodeJS.ProcessEnv = process.env): ConfigEtl {
  const resultat = schemaEnv.safeParse(variables);
  if (!resultat.success) {
    const noms = [...new Set(resultat.error.issues.map((probleme) => probleme.path.join('.')))];
    throw new Error(
      `Variables d'environnement manquantes ou invalides : ${noms.join(', ')}. ` +
        'Voir .env.example et docs/07-contrat-infra.md § 3.',
    );
  }
  return resultat.data;
}
