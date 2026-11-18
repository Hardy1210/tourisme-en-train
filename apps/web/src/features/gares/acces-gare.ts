// Trajet de l'utilisateur à sa gare de départ (D096). Fonctions pures : aucune base, aucun réseau.
import { parametres } from '@/config/parametres';
import {
  distanceMarcheM,
  distanceParcourueM,
  dureeMarcheMin,
  dureeVeloMin,
} from '@/lib/geo/distances';
import {
  formaterDistance,
  formaterDistanceVolOiseau,
  formaterDureeEstimee,
} from '@/lib/geo/formats';

/**
 * Trajet jusqu'à la gare, une seule règle pour « Votre gare » et les gares proches (D096, D097) : durée à pied
 * si la gare est à `acces.rayonPiedM` au plus (mesurés avec le détour) ; au-delà, durée à vélo seulement si la
 * gare a un parking vélo, sa preuve, et jusqu'à `acces.rayonVeloM` avec le détour ; sinon la distance seule.
 */
export function accesGare(
  volOiseauM: number,
  parkingVelo: boolean,
): { dureeMarcheMin: number | null; dureeVeloMin: number | null; distance: string } {
  const aPied = distanceMarcheM(volOiseauM) <= parametres.acces.rayonPiedM;
  const aVelo =
    !aPied && parkingVelo && distanceParcourueM(volOiseauM, 'velo') <= parametres.acces.rayonVeloM;
  return {
    dureeMarcheMin: aPied ? dureeMarcheMin(volOiseauM) : null,
    dureeVeloMin: aVelo ? dureeVeloMin(volOiseauM) : null,
    distance: formaterDistance(volOiseauM),
  };
}

/**
 * Texte court des listes de gares proches, d'après `accesGare` : « ≈ 27 min à pied », « ≈ 17 min à vélo » ou la
 * distance « à vol d'oiseau » (D102). À vélo, `distance` se lit en dessous, en plus petit ; `aVelo` : la ligne affiche aussi « Parking
 * vélo à la gare », la preuve (D097).
 */
export function accesGareProche(
  volOiseauM: number,
  parkingVelo: boolean,
): { texte: string; distance: string | null; aVelo: boolean } {
  const {
    dureeMarcheMin: aPied,
    dureeVeloMin: aVelo,
    distance,
  } = accesGare(volOiseauM, parkingVelo);
  if (aPied !== null)
    return { texte: `${formaterDureeEstimee(aPied)} à pied`, distance: null, aVelo: false };
  if (aVelo !== null)
    return { texte: `${formaterDureeEstimee(aVelo)} à vélo`, distance, aVelo: true };
  return { texte: formaterDistanceVolOiseau(volOiseauM), distance: null, aVelo: false };
}

/** Applications de cartes proposées (D096) : Plans n'existe que sur iPhone. */
export type ApplicationCartes = 'plans' | 'google';

/**
 * Lien vers l'application de cartes, avec la gare pour seule destination : le téléphone part de sa propre
 * position, que Wagoo ne met jamais dans le lien (règle 5). Aucun calcul d'itinéraire chez nous (règle 6).
 */
export function lienItineraire(
  gare: { lat: number; lon: number },
  application: ApplicationCartes,
): string {
  const destination = `${gare.lat},${gare.lon}`;
  const { apple, google } = parametres.itineraire;
  const lien = new URL(application === 'plans' ? apple : google);
  if (application === 'plans') lien.searchParams.set('daddr', destination);
  else {
    lien.searchParams.set('api', '1');
    lien.searchParams.set('destination', destination);
  }
  return lien.toString();
}
