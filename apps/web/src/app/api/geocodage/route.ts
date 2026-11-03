import { schemaParametresGeocodage } from '@/features/localisation/schemas';
import { geocoder } from '@/features/localisation/server/service';
import { gererRoute, repondre } from '@/lib/http/reponse';
import { lireParametres } from '@/lib/http/valider';

export const GET = gererRoute('geocodage', async (requete) => {
  const parametres = lireParametres(requete, schemaParametresGeocodage);
  const reponse = await geocoder(parametres);
  // Repli hors ligne : jamais mis en cache, pour retrouver l'API dès son retour.
  return repondre(reponse, reponse.horsLigne ? 'aucun' : { publicMaxAgeS: 86400 });
});
