import { maintenantParis } from '@tourisme/commun';

import { schemaParametresDestinations } from '@/features/destinations/schemas';
import { destinations } from '@/features/destinations/server/service';
import { gererRoute, repondre } from '@/lib/http/reponse';
import { lireParametres } from '@/lib/http/valider';

// 300 s : le prochain départ dépend de l'heure actuelle (docs/05-api.md § 3.4, D047).
export const GET = gererRoute('destinations', async (requete) => {
  const parametres = lireParametres(requete, schemaParametresDestinations);
  return repondre(await destinations(parametres, maintenantParis()), { publicMaxAgeS: 300 });
});
