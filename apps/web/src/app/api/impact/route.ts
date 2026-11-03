import { schemaParametresImpact } from '@/features/impact/schemas';
import { impact } from '@/features/impact/server/service';
import { gererRoute, repondre } from '@/lib/http/reponse';
import { lireParametres } from '@/lib/http/valider';

export const GET = gererRoute('impact', async (requete) => {
  const parametres = lireParametres(requete, schemaParametresImpact);
  return repondre(await impact(parametres), { publicMaxAgeS: 86400 });
});
