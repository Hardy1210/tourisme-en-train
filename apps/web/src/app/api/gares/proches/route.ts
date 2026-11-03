import { schemaParametresGaresProches } from '@/features/gares/schemas';
import { garesProches } from '@/features/gares/server/service';
import { gererRoute, repondre } from '@/lib/http/reponse';
import { lireParametres } from '@/lib/http/valider';

// Réponse dépendant de la position : jamais en cache (docs/05-api.md § 1.11).
export const GET = gererRoute('gares/proches', async (requete) => {
  const parametres = lireParametres(requete, schemaParametresGaresProches);
  return repondre(await garesProches(parametres), 'aucun');
});
