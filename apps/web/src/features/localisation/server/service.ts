// Recherche de ville et commune de l'utilisateur (docs/05-api.md § 3.11, § 3.11 bis, D022, D051).
// API Adresse d'abord ; en panne ou sans réseau, repli sur les gares en base (`horsLigne: true`).
import 'server-only';

import { parametres } from '@/config/parametres';
import { communeAuPoint, rechercherAdresses } from '@/lib/external/adresse';
import { ServiceExterneIndisponible } from '@/lib/http/erreurs';
import { journal } from '@/lib/journal';

import type {
  ParametresGeocodage,
  ParametresInverse,
  ReponseGeocodage,
  ReponseInverse,
} from '../schemas';

import { communeDeLaGareLaPlusProche, garesParNom } from './requetes';

/** Panne de l'API : journalisée sans le texte cherché ni la position (règle 5). */
function signalerRepli(operation: string): void {
  journal.avertissement('API Adresse indisponible : repli sur la base', { operation });
}

export async function geocoder({ q }: ParametresGeocodage): Promise<ReponseGeocodage> {
  const limite = parametres.limites.geocodage;
  const gares = (await garesParNom(q, limite)).map((g) => ({
    libelle: g.gare,
    commune: g.commune,
    lat: g.lat,
    lon: g.lon,
    type: 'gare' as const,
  }));
  try {
    const adresses = (await rechercherAdresses(q, limite)).map(({ codeInsee: _, ...a }) => a);
    return { resultats: [...gares, ...adresses].slice(0, limite), horsLigne: false };
  } catch (erreur) {
    if (!(erreur instanceof ServiceExterneIndisponible)) throw erreur;
    signalerRepli('recherche');
    return { resultats: gares, horsLigne: true };
  }
}

export async function communeDeLUtilisateur({
  lat,
  lon,
}: ParametresInverse): Promise<ReponseInverse> {
  try {
    const trouvee = await communeAuPoint(lat, lon);
    if (trouvee) return { ...trouvee, horsLigne: false };
  } catch (erreur) {
    if (!(erreur instanceof ServiceExterneIndisponible)) throw erreur;
    signalerRepli('inverse');
  }
  const gare = await communeDeLaGareLaPlusProche(lat, lon);
  if (gare === null) throw new ServiceExterneIndisponible('Impossible de trouver votre commune.');
  return { commune: gare.commune, codeInsee: gare.code_insee, horsLigne: true };
}
