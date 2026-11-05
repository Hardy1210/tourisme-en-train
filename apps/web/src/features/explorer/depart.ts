// D'où part l'utilisateur : une décision pure, à partir de l'URL, de sa position et des gares trouvées.
import type { GareProche } from '@/features/gares/schemas';
import type { EtatPosition } from '@/features/localisation/position';
import type { DerniereGare } from './derniere-gare';

export type GareDepart = {
  uic: string;
  nom: string;
  commune: string | null;
  lat: number;
  lon: number;
  /** Seulement si la gare vient de la position de l'utilisateur. */
  distanceM: number | null;
  dureeMarcheMin: number | null;
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
  /** Gare proposée par défaut (D064) ; sans elle, la plus proche. */
  uicConseille?: string | null;
  /** Hors ligne : la dernière gare connue, faute de pouvoir chercher (D071). */
  gareHorsLigne?: DerniereGare | null;
};

export function calculerDepart({
  uicChoisi,
  gareChoisie,
  position,
  proches,
  uicConseille = null,
  gareHorsLigne = null,
}: EntreesDepart): Depart {
  if (
    gareHorsLigne &&
    (uicChoisi === null
      ? !proches.donnees
      : uicChoisi === gareHorsLigne.uic && !gareChoisie.donnees)
  ) {
    return {
      etat: 'pret',
      origine: 'choix',
      point: { lat: gareHorsLigne.lat, lon: gareHorsLigne.lon },
      gare: { ...gareHorsLigne, distanceM: null, dureeMarcheMin: null, dureeVeloMin: null },
      proches: [],
    };
  }
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
        lat: gare.lat,
        lon: gare.lon,
        distanceM: null,
        dureeMarcheMin: null,
        dureeVeloMin: null,
      },
      proches: proches.donnees ?? [],
    };
  }

  if (position.etat === 'attente') return { etat: 'chargement' };
  if (position.etat !== 'trouvee') return { etat: 'sans_position', raison: position.etat };
  if (proches.statutErreur !== null) return { etat: 'erreur' };
  if (!proches.donnees) return { etat: 'chargement' };

  const gare = proches.donnees.find((g) => g.uic === uicConseille) ?? proches.donnees[0];
  if (!gare) return { etat: 'erreur' };
  if (!gare.dansRegion) return { etat: 'hors_region' };
  return {
    etat: 'pret',
    origine: 'position',
    point: { lat: position.lat, lon: position.lon },
    gare: {
      uic: gare.uic,
      nom: gare.nom,
      commune: gare.commune,
      lat: gare.lat,
      lon: gare.lon,
      distanceM: gare.distanceM,
      dureeMarcheMin: gare.dureeMarcheMin,
      dureeVeloMin: gare.dureeVeloMin,
    },
    proches: proches.donnees,
  };
}

/**
 * La gare la plus proche, quand la gare proposée en est une autre (D064) : l'écran doit le dire et
 * permettre d'y revenir d'un geste. Jamais hors région, où rien ne serait affiché.
 */
export function plusProcheDifferente(depart: Extract<Depart, { etat: 'pret' }>): GareProche | null {
  if (depart.origine !== 'position') return null;
  const plusProche = depart.proches[0];
  return plusProche && plusProche.dansRegion && plusProche.uic !== depart.gare.uic
    ? plusProche
    : null;
}
