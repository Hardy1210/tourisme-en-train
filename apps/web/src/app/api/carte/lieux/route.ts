import { parametres } from '@/config/parametres';
import { lieuxPourCarte } from '@/features/lieux/server/service';
import { gererRoute, repondreCompresse } from '@/lib/http/reponse';

// Les mêmes lieux pour tout le monde, changés seulement par un import : en cache (D091).
export const GET = gererRoute('carte-lieux', async (requete) =>
  repondreCompresse(requete, await lieuxPourCarte(), {
    publicMaxAgeS: parametres.cache.donneesStablesS,
  }),
);
