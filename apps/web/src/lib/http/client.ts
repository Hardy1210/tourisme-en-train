// Appels de l'interface vers l'API de l'application : réponse validée, erreur au message lisible.
import type { z } from 'zod';

const MESSAGE_PAR_DEFAUT = 'Un problème est survenu. Réessayez dans un instant.';

export class ErreurClient extends Error {
  constructor(
    message: string,
    readonly statut: number,
  ) {
    super(message);
    this.name = 'ErreurClient';
  }
}

function messageDe(corps: unknown): string {
  if (typeof corps !== 'object' || corps === null || !('erreur' in corps)) {
    return MESSAGE_PAR_DEFAUT;
  }
  const { erreur } = corps;
  if (typeof erreur !== 'object' || erreur === null || !('message' in erreur)) {
    return MESSAGE_PAR_DEFAUT;
  }
  return typeof erreur.message === 'string' ? erreur.message : MESSAGE_PAR_DEFAUT;
}

export async function lireApi<S extends z.ZodType>(
  chemin: string,
  schema: S,
  signal?: AbortSignal,
): Promise<z.infer<S>> {
  const reponse = await fetch(chemin, { signal });
  const corps: unknown = await reponse.json().catch(() => null);
  if (!reponse.ok) throw new ErreurClient(messageDe(corps), reponse.status);
  return schema.parse(corps);
}

/** Une erreur 4xx ne changera pas en réessayant ; une panne réseau ou serveur, peut-être. */
export function fautReessayer(essais: number, erreur: unknown, maximum = 2): boolean {
  if (erreur instanceof ErreurClient && erreur.statut < 500) return false;
  return essais < maximum;
}
