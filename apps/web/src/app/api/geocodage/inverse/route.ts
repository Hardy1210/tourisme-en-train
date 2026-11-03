import { schemaParametresInverse } from '@/features/localisation/schemas';
import { communeDeLUtilisateur } from '@/features/localisation/server/service';
import { gererRoute, repondre } from '@/lib/http/reponse';
import { lireParametres } from '@/lib/http/valider';

// Position de l'utilisateur : aucun cache, ni partagé ni serveur (D051, règle 5).
export const GET = gererRoute('geocodage/inverse', async (requete) => {
  const parametres = lireParametres(requete, schemaParametresInverse);
  return repondre(await communeDeLUtilisateur(parametres), 'aucun');
});
