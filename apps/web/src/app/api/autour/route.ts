import { schemaParametresAutour } from '@/features/lieux/schemas';
import { autour } from '@/features/lieux/server/service';
import { gererRoute, repondre } from '@/lib/http/reponse';
import { lireParametres } from '@/lib/http/valider';

// Réponse dépendant de la position : jamais en cache (docs/05-api.md § 1.11).
export const GET = gererRoute('autour', async (requete) => {
  const parametres = lireParametres(requete, schemaParametresAutour);
  return repondre(await autour(parametres), 'aucun');
});
