// Réponses JSON, en-têtes de cache et traduction des erreurs (docs/05-api.md § 1).
// Seul endroit qui transforme une erreur en réponse : les routes restent fines.
import { journal } from '@/lib/journal';

import { ErreurApi } from './erreurs';

/** `aucun` : réponse dépendant de la position ou de l'état, jamais mise en cache (§ 1.11). */
export type Cache = 'aucun' | { publicMaxAgeS: number };

function enteteCache(cache: Cache): string {
  return cache === 'aucun' ? 'no-store' : `public, max-age=${cache.publicMaxAgeS}`;
}

export function repondre(donnees: unknown, cache: Cache, statut = 200): Response {
  return Response.json(donnees, {
    status: statut,
    headers: { 'Cache-Control': enteteCache(cache) },
  });
}

/**
 * Détail d'une erreur pour le journal. Le message d'une requête en échec se termine par ses paramètres
 * (« params: 5.02,47.32 ») : ils peuvent contenir une position, et sont retirés (règle 5).
 */
export function detailErreur(erreur: unknown): unknown {
  if (!(erreur instanceof Error)) return 'Erreur sans détail';
  const [message = ''] = erreur.message.split(/\n?params:/);
  return {
    nom: erreur.name,
    message,
    ...(erreur.cause instanceof Error ? { cause: erreur.cause.message } : {}),
  };
}

export function repondreErreur(erreur: unknown, route: string): Response {
  if (erreur instanceof ErreurApi) {
    return repondre(
      {
        erreur: {
          code: erreur.code,
          message: erreur.message,
          ...(erreur.reessayable ? { reessayable: true } : {}),
        },
      },
      'aucun',
      erreur.statut,
    );
  }
  // Inattendue : le détail va dans les journaux, l'utilisateur reçoit un message sans détail technique.
  journal.erreur('Erreur inattendue dans une route', { route, erreur: detailErreur(erreur) });
  return repondre(
    {
      erreur: { code: 'ERREUR_INTERNE', message: 'Une erreur est survenue. Réessayez plus tard.' },
    },
    'aucun',
    500,
  );
}

/** Segments dynamiques d'une route Next.js (`[uic]`, `[cle]`), passés en second argument. */
export type Segments<S extends Record<string, string>> = { params: Promise<S> };

/** Enveloppe d'une route : toute erreur levée par le traitement devient une réponse au bon format. */
export function gererRoute<C = unknown>(
  route: string,
  traitement: (requete: Request, contexte: C) => Promise<Response>,
): (requete: Request, contexte: C) => Promise<Response> {
  return async (requete, contexte) => {
    try {
      return await traitement(requete, contexte);
    } catch (erreur) {
      return repondreErreur(erreur, route);
    }
  };
}
