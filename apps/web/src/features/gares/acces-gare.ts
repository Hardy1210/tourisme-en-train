// Trajet de l'utilisateur à sa gare de départ (D096). Fonctions pures : aucune base, aucun réseau.
import { parametres } from '@/config/parametres';
import { distanceMarcheM, dureeMarcheMin } from '@/lib/geo/distances';
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

/** Texte court des listes de gares proches : « 27 min à pied » ou « 3,2 km ». */
export function texteAccesGare(volOiseauM: number): string {
  const { dureeMarcheMin: minutes, distance } = accesGare(volOiseauM);
  return minutes === null ? distance : `${minutes} min à pied`;
}

/**
 * Lien vers l'application de cartes, avec la gare pour seule destination : le téléphone part de sa propre
 * position, que Wagoo ne met jamais dans le lien (règle 5). Aucun calcul d'itinéraire chez nous (règle 6).
 */
export function lienItineraire(gare: { lat: number; lon: number }, surIphone: boolean): string {
  const destination = `${gare.lat},${gare.lon}`;
  const { apple, google } = parametres.itineraire;
  const lien = new URL(surIphone ? apple : google);
  if (surIphone) lien.searchParams.set('daddr', destination);
  else {
    lien.searchParams.set('api', '1');
    lien.searchParams.set('destination', destination);
  }
  return lien.toString();
}
