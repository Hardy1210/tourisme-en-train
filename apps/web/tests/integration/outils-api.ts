// Outils des tests d'intégration des routes : l'application lit la base de test (`<nom>_test`).
// À importer AVANT toute route (les routes sont chargées par `import()` dans `beforeAll`).

/** Adresse de la base de test pour un rôle : même serveur, base `<nom>_test`. */
export function urlTest(variable: 'BDD_URL_MIGRATIONS' | 'BDD_URL_APP'): string {
  const url = process.env[variable];
  if (!url) throw new Error(`${variable} manquante (voir .env.example).`);
  const adresse = new URL(url);
  adresse.pathname = `${adresse.pathname}_test`;
  return adresse.toString();
}

process.env.BDD_URL_APP = urlTest('BDD_URL_APP');

/** Une route Next.js ; méthode (et non propriété) : accepte aussi les routes à segments typés. */
export type Route = {
  GET(requete: Request, contexte: { params: Promise<Record<string, string>> }): Promise<Response>;
};

export type Reponse = { statut: number; cache: string | null; corps: unknown };

/**
 * Appelle une route avec `chemin` (ex. `/api/autour?lat=…`) et lit sa réponse JSON ; `segments` :
 * valeurs des segments dynamiques (`{ uic: 'EX000002' }`), comme Next.js les transmet.
 */
export async function appeler(
  route: Route,
  chemin: string,
  segments: Record<string, string> = {},
): Promise<Reponse> {
  const reponse = await route.GET(new Request(`http://localhost${chemin}`), {
    params: Promise.resolve(segments),
  });
  return {
    statut: reponse.status,
    cache: reponse.headers.get('Cache-Control'),
    corps: await reponse.json(),
  };
}

/** Message d'erreur d'une réponse au format unique `{ erreur: { code, message } }`. */
export function erreurDe(corps: unknown): { code: string; message: string } {
  if (typeof corps === 'object' && corps !== null && 'erreur' in corps) {
    const { erreur } = corps;
    if (typeof erreur === 'object' && erreur !== null && 'code' in erreur && 'message' in erreur) {
      return { code: String(erreur.code), message: String(erreur.message) };
    }
  }
  throw new Error(`Réponse sans erreur : ${JSON.stringify(corps)}`);
}
