// Variables d'environnement de l'application, validées au démarrage (docs/07-contrat-infra.md § 3).
// Une variable manquante ou invalide arrête l'application avec un message clair (noms seulement, jamais les valeurs).
import 'server-only';
import { z } from 'zod';

const schemaEnv = z.object({
  BDD_URL_APP: z.url({ protocol: /^postgres(ql)?$/ }),
  URL_APP: z.url({ protocol: /^https?$/ }),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  // Facultative (temps réel, P1) : une valeur vide vaut « absente ».
  SNCF_CLE_API: z
    .string()
    .optional()
    .transform((cle) => (cle ? cle : undefined)),
});

export type Env = z.infer<typeof schemaEnv>;

function lireEnv(): Env {
  const resultat = schemaEnv.safeParse(process.env);
  if (!resultat.success) {
    const variables = [
      ...new Set(resultat.error.issues.map((probleme) => probleme.path.join('.'))),
    ];
    throw new Error(
      `Variables d'environnement manquantes ou invalides : ${variables.join(', ')}. ` +
        'Voir .env.example et docs/07-contrat-infra.md § 3.',
    );
  }
  return resultat.data;
}

export const env: Env = lireEnv();
