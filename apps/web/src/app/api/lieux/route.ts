import { maintenantParis } from '@tourisme/commun';

import { schemaParametresLieuxAccessibles } from '@/features/lieux/schemas';
import { accessibles } from '@/features/lieux/server/accessibles';
import { gererRoute, repondre } from '@/lib/http/reponse';
import { lireParametres } from '@/lib/http/valider';

// Ne dépend que de la date et de la gare, pas de l'heure ni de la position (docs/05-api.md § 3.6 bis).
export const GET = gererRoute('lieux', async (requete) => {
  const parametres = lireParametres(requete, schemaParametresLieuxAccessibles);
  return repondre(await accessibles(parametres, maintenantParis().dateDuJour), {
    publicMaxAgeS: 3600,
  });
});
