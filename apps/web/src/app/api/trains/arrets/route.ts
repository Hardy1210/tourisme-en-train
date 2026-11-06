import { maintenantParis } from '@tourisme/commun';

import { parametres as reglages } from '@/config/parametres';
import { schemaParametresTrains } from '@/features/trains/schemas';
import { arretsDuTrain } from '@/features/trains/server/service';
import { gererRoute, repondre } from '@/lib/http/reponse';
import { lireParametres } from '@/lib/http/valider';

export const GET = gererRoute('trains-arrets', async (requete) => {
  const parametres = lireParametres(requete, schemaParametresTrains);
  return repondre(await arretsDuTrain(parametres, maintenantParis()), {
    publicMaxAgeS: reglages.cache.horairesPrevusS,
  });
});
