import { maintenantParis } from '@tourisme/commun';

import { schemaParametresLieuxAccessibles } from '@/features/lieux/schemas';
import { rangees } from '@/features/lieux/server/rangees';
import { gererRoute, repondre } from '@/lib/http/reponse';
import { lireParametres } from '@/lib/http/valider';

// Onglet Lieux en rangées (docs/05-api.md § 3.6 ter, D121) : mêmes paramètres que /api/lieux.
// Ne dépend que de la date et de la gare, pas de l'heure ni de la position.
export const GET = gererRoute('lieux-rangees', async (requete) => {
  const parametres = lireParametres(requete, schemaParametresLieuxAccessibles);
  return repondre(await rangees(parametres, maintenantParis().dateDuJour), {
    publicMaxAgeS: 3600,
  });
});
