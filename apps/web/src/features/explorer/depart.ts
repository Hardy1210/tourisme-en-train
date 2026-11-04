// D'où part l'utilisateur : une décision pure, à partir de l'URL, de sa position et des gares trouvées.
import type { GareProche } from '@/features/gares/schemas';
import type { EtatPosition } from '@/features/localisation/position';

export type GareDepart = {
  uic: string;
  nom: string;
  commune: string | null;
  /** Seulement si la gare vient de la position de l'utilisateur. */
  distanceM: number | null;
  dureeVeloMin: number | null;
};

export type Depart =
  | { etat: 'chargement' }
  | { etat: 'sans_position'; raison: 'refusee' | 'indisponible' | 'gare_inconnue' }
  | { etat: 'hors_region' }
  | { etat: 'erreur' }
  | {
      etat: 'pret';
      origine: 'position' | 'choix';
      gare: GareDepart;
      /** Point de « À deux pas » : l'utilisateur, ou la gare choisie. Jamais écrit dans l'URL (D058). */
      point: { lat: number; lon: number };
      proches: GareProche[];
    };

type Requete<T> = { donnees: T | undefined; statutErreur: number | null };

export type EntreesDepart = {
  uicChoisi: string | null;
  gareChoisie: Requete<{
    uic: string;
    nom: string;
    lat: number;
    lon: number;
    dansRegion: boolean;
    commune: { nom: string | null };
  }>;
  position: EtatPosition;
  proches: Requete<GareProche[]>;
};

export function calculerDepart({
  uicChoisi,
  gareChoisie,
  position,
  proches,
}: EntreesDepart): Depart {
  if (uicChoisi !== null) {
    // 400 : code mal formé dans un lien ; 404 : gare disparue. Dans les deux cas, on redemande.
    if (gareChoisie.statutErreur === 400 || gareChoisie.statutErreur === 404) {
      return { etat: 'sans_position', raison: 'gare_inconnue' };
    }
    if (gareChoisie.statutErreur !== null) return { etat: 'erreur' };
    const gare = gareChoisie.donnees;
    if (!gare) return { etat: 'chargement' };
    if (!gare.dansRegion) return { etat: 'hors_region' };
    return {
      etat: 'pret',
      origine: 'choix',
      point: { lat: gare.lat, lon: gare.lon },
      gare: {
        uic: gare.uic,
        nom: gare.nom,
        commune: gare.commune.nom,
        distanceM: null,
        dureeVeloMin: null,
      },
      proches: proches.donnees ?? [],
    };
  }

  if (position.etat === 'attente') return { etat: 'chargement' };
  if (position.etat !== 'trouvee') return { etat: 'sans_position', raison: position.etat };
  if (proches.statutErreur !== null) return { etat: 'erreur' };
  if (!proches.donnees) return { etat: 'chargement' };

  const [plusProche] = proches.donnees;
  if (!plusProche) return { etat: 'erreur' };
  if (!plusProche.dansRegion) return { etat: 'hors_region' };
  return {
    etat: 'pret',
    origine: 'position',
    point: { lat: position.lat, lon: position.lon },
    gare: {
      uic: plusProche.uic,
      nom: plusProche.nom,
      commune: plusProche.commune,
      distanceM: plusProche.distanceM,
      dureeVeloMin: plusProche.dureeVeloMin,
    },
    proches: proches.donnees,
  };
}
