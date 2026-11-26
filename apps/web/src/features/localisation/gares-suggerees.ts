// Grandes gares proposées quand on ne connaît pas la position de l'utilisateur : accueil (D113),
// « Dans quelle ville êtes-vous ? » et page « Trajet ». Une seule liste, pour qu'elles restent les mêmes.
import { parametres } from '@/config/parametres';

/** Les trois premières de `region.garesPrincipales` : de quoi tenir sur une ligne de téléphone. */
export const GARES_SUGGEREES = parametres.region.garesPrincipales.slice(0, 3);
