// État des filtres dans l'URL (fiche E11, D058) : partageable, jamais de position. Une valeur
// invalide dans un lien retombe sur le défaut : un lien abîmé ne casse jamais l'écran.
import { CATEGORIES, type Categorie } from '@tourisme/commun';
import { parametres } from '@/config/parametres';

export type Filtres = {
  /** null = aujourd'hui. */
  date: string | null;
  /** Vide = toutes. */
  categories: readonly Categorie[];
  rayon: number;
  dureeMax: number;
  faisable: boolean;
};

const { autourDeMoiDefautM, autourDeMoiOptionsM } = parametres.rayons;
const { trainMaxOptionsMin } = parametres.durees;

export const FILTRES_PAR_DEFAUT: Filtres = {
  date: null,
  categories: [],
  rayon: autourDeMoiDefautM,
  dureeMax: Math.max(...trainMaxOptionsMin),
  faisable: false,
};

const parmi = (texte: string | null, options: readonly number[], defaut: number): number => {
  const valeur = Number(texte);
  return options.includes(valeur) ? valeur : defaut;
};

const estCategorie = (texte: string): texte is Categorie =>
  CATEGORIES.some((categorie) => categorie === texte);

export function lireFiltres(url: URLSearchParams): Filtres {
  const date = url.get('date');
  return {
    date: date !== null && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    categories: [...new Set((url.get('categories') ?? '').split(',').filter(estCategorie))],
    rayon: parmi(url.get('rayon'), autourDeMoiOptionsM, FILTRES_PAR_DEFAUT.rayon),
    dureeMax: parmi(url.get('dureeMax'), trainMaxOptionsMin, FILTRES_PAR_DEFAUT.dureeMax),
    faisable: url.get('faisable') === '1',
  };
}

/** Nouvelle URL : la valeur par défaut n'y figure pas, les autres paramètres (`gare`) sont gardés. */
export function ecrireFiltres(url: URLSearchParams, filtres: Filtres): URLSearchParams {
  const suite = new URLSearchParams(url);
  const poser = (cle: string, valeur: string | null) => {
    if (valeur === null) suite.delete(cle);
    else suite.set(cle, valeur);
  };
  poser('date', filtres.date);
  poser('categories', filtres.categories.length > 0 ? filtres.categories.join(',') : null);
  poser('rayon', filtres.rayon === FILTRES_PAR_DEFAUT.rayon ? null : String(filtres.rayon));
  poser(
    'dureeMax',
    filtres.dureeMax === FILTRES_PAR_DEFAUT.dureeMax ? null : String(filtres.dureeMax),
  );
  poser('faisable', filtres.faisable ? '1' : null);
  // Jamais de position dans un lien, même arrivée par un ancien lien (D058).
  suite.delete('lat');
  suite.delete('lon');
  return suite;
}

/** Nombre affiché sur le bouton « Filtres » : ce qui s'écarte du défaut, hors date. */
export function nombreFiltres(filtres: Filtres): number {
  return (
    filtres.categories.length +
    (filtres.rayon === FILTRES_PAR_DEFAUT.rayon ? 0 : 1) +
    (filtres.dureeMax === FILTRES_PAR_DEFAUT.dureeMax ? 0 : 1) +
    (filtres.faisable ? 1 : 0)
  );
}

/** « 30 min », « 1 h », « 3 h ». */
export const libelleDureeMax = (minutes: number): string =>
  minutes < 60 ? `${minutes} min` : `${minutes / 60} h`;

/** « 2 km ». */
export const libelleRayon = (metres: number): string => `${metres / 1000} km`;
