// Configuration du traitement des données : variables d'environnement (validées par Zod)
// et paramètres métier (schéma unique de @tourisme/commun, jamais revalidés ici).
import { z } from 'zod';

export { parametres } from '@tourisme/commun';

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
