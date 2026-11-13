import { parametres } from '@/config/parametres';
import { schemaParametresLieuxCarte } from '@/features/lieux/schemas';
import { lieuxPourCarte } from '@/features/lieux/server/service';
import { gererRoute, repondreCompresse } from '@/lib/http/reponse';
import { lireParametres } from '@/lib/http/valider';

// Autour d'une position : jamais en cache (règle 5, docs/05-api.md § 1.11). Autour d'une gare : les mêmes
// lieux pour tout le monde, en cache (D094).
export const GET = gererRoute('carte-lieux', async (requete) => {
  const zone = lireParametres(requete, schemaParametresLieuxCarte);
  return repondreCompresse(
    requete,
    await lieuxPourCarte(zone),
    'gare' in zone ? { publicMaxAgeS: parametres.cache.donneesStablesS } : 'aucun',
  );
});
