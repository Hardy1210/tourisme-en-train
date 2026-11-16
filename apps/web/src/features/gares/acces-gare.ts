// Trajet de l'utilisateur à sa gare de départ (D096). Fonctions pures : aucune base, aucun réseau.
import { parametres } from '@/config/parametres';
import {
  distanceMarcheM,
  distanceParcourueM,
  dureeMarcheMin,
  dureeVeloMin,
} from '@/lib/geo/distances';
import { formaterDistance } from '@/lib/geo/formats';

/**
 * Durée à pied si la gare est à `acces.rayonPiedM` au plus (mesurés avec le détour), sinon la distance seule.
 * Jamais de durée à vélo : rien ne prouve qu'on a un vélo près de soi.
 */
export function accesGare(volOiseauM: number): { dureeMarcheMin: number | null; distance: string } {
  return {
    dureeMarcheMin:
      distanceMarcheM(volOiseauM) <= parametres.acces.rayonPiedM
        ? dureeMarcheMin(volOiseauM)
        : null,
    distance: formaterDistance(volOiseauM),
  };
}

/**
 * Texte court des listes de gares proches : « 27 min à pied », sinon « ≈ 17 min à vélo » si la gare a un
 * parking vélo, la preuve qu'on peut y laisser le sien (D097), jusqu'à `acces.rayonVeloM` avec le détour ;
 * sinon la distance. `aVelo` : la ligne affiche aussi « Parking vélo à la gare ».
 */
export function accesGareProche(
  volOiseauM: number,
  parkingVelo: boolean,
): { texte: string; aVelo: boolean } {
  const { dureeMarcheMin: minutes, distance } = accesGare(volOiseauM);
  if (minutes !== null) return { texte: `${minutes} min à pied`, aVelo: false };
  if (parkingVelo && distanceParcourueM(volOiseauM, 'velo') <= parametres.acces.rayonVeloM) {
    return { texte: `≈ ${dureeVeloMin(volOiseauM)} min à vélo`, aVelo: true };
  }
  return { texte: distance, aVelo: false };
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
