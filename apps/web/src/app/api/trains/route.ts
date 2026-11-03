import { maintenantParis } from '@tourisme/commun';

import { schemaParametresTrains } from '@/features/trains/schemas';
import { trains } from '@/features/trains/server/service';
import { gererRoute, repondre } from '@/lib/http/reponse';
import { lireParametres } from '@/lib/http/valider';

export const GET = gererRoute('trains', async (requete) => {
  const parametres = lireParametres(requete, schemaParametresTrains);
  return repondre(await trains(parametres, maintenantParis()), { publicMaxAgeS: 900 });
});
