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
  /** Recherche de destination (D084) : texte tapé, ou nom de la destination touchée. Vide = aucune. */
  recherche: string;
  /** Code UIC de la destination touchée dans la liste ; null pour un texte tapé. */
  destination: string | null;
};

const { autourDeMoiDefautM, autourDeMoiOptionsM } = parametres.rayons;
const { trainMaxOptionsMin } = parametres.durees;

export const FILTRES_PAR_DEFAUT: Filtres = {
  date: null,
  categories: [],
  rayon: autourDeMoiDefautM,
  dureeMax: Math.max(...trainMaxOptionsMin),
  faisable: false,
  recherche: '',
  destination: null,
};

const parmi = (texte: string | null, options: readonly number[], defaut: number): number => {
  const valeur = Number(texte);
  return options.includes(valeur) ? valeur : defaut;
};

const estCategorie = (texte: string): texte is Categorie =>
  CATEGORIES.some((categorie) => categorie === texte);

export function lireFiltres(url: URLSearchParams): Filtres {
  const date = url.get('date');
  const recherche = (url.get('recherche') ?? '').trim();
  const destination = url.get('destination');
  return {
    date: date !== null && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    categories: [...new Set((url.get('categories') ?? '').split(',').filter(estCategorie))],
    rayon: parmi(url.get('rayon'), autourDeMoiOptionsM, FILTRES_PAR_DEFAUT.rayon),
    dureeMax: parmi(url.get('dureeMax'), trainMaxOptionsMin, FILTRES_PAR_DEFAUT.dureeMax),
    faisable: url.get('faisable') === '1',
    recherche,
    // Une destination touchée garde toujours son nom, affiché dans la barre du trajet.
    destination:
      destination !== null && /^[0-9A-Z]{8}$/.test(destination) && recherche !== ''
        ? destination
        : null,
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
  const recherche = filtres.recherche.trim();
  poser('recherche', recherche === '' ? null : recherche);
  poser('destination', recherche === '' ? null : filtres.destination);
  // Jamais de position dans un lien, même arrivée par un ancien lien (D058).
  suite.delete('lat');
  suite.delete('lon');
  return suite;
}

/** La date compte quand ce n'est pas aujourd'hui (elle vit dans « Filtres ») ; sans `dateDuJour`, toute date posée compte. */
function compteDate(filtres: Filtres, dateDuJour?: string): number {
  return filtres.date !== null && filtres.date !== dateDuJour ? 1 : 0;
}

/** Nombre affiché sur le bouton « Filtres » : ce qui s'écarte du défaut, date comprise. */
export function nombreFiltres(filtres: Filtres, dateDuJour?: string): number {
  // Destination choisie : « Filtres » ne montre que la date, le bouton ne compte pas ce qui est caché.
  if (filtres.destination !== null) {
    return filtres.categories.length + compteDate(filtres, dateDuJour);
  }
  return (
    filtres.categories.length +
    (filtres.rayon === FILTRES_PAR_DEFAUT.rayon ? 0 : 1) +
    (filtres.dureeMax === FILTRES_PAR_DEFAUT.dureeMax ? 0 : 1) +
    (filtres.faisable ? 1 : 0) +
    compteDate(filtres, dateDuJour)
  );
}

/** Écran Lieux : ni rayon ni « faisable », que sa route n'utilise pas (`05` § 3.6 bis). */
export function nombreFiltresLieux(filtres: Filtres, dateDuJour?: string): number {
  return (
    filtres.categories.length +
    (filtres.dureeMax === FILTRES_PAR_DEFAUT.dureeMax ? 0 : 1) +
    compteDate(filtres, dateDuJour)
  );
}

const CLES_FILTRES = [
  'categories',
  'rayon',
  'dureeMax',
  'faisable',
  'recherche',
  'destination',
] as const;

/** Les filtres d'une adresse, et rien d'autre : jamais de position (D058). */
export const filtresDeLUrl = (url: URLSearchParams): string => {
  const filtres = new URLSearchParams();
  for (const cle of CLES_FILTRES) {
    const valeur = url.get(cle);
    if (valeur !== null) filtres.set(cle, valeur);
  }
  return filtres.toString();
};

/**
 * Lien d'un onglet : la gare choisie et la date suivent d'un écran à l'autre, et l'écran retrouve ses
 * propres filtres (`filtresDeLEcran`), sans ceux de l'écran qu'on quitte (D070).
 */
export function lienAvecDepart(chemin: string, url: URLSearchParams, filtresDeLEcran = ''): string {
  const suite = new URLSearchParams();
  for (const cle of ['gare', 'date']) {
    const valeur = url.get(cle);
    if (valeur !== null) suite.set(cle, valeur);
  }
  for (const [cle, valeur] of new URLSearchParams(filtresDeLEcran)) suite.set(cle, valeur);
  const texte = suite.toString();
  return texte ? `${chemin}?${texte}` : chemin;
}

/** « 30 min », « 1 h », « 3 h ». */
export const libelleDureeMax = (minutes: number): string =>
  minutes < 60 ? `${minutes} min` : `${minutes / 60} h`;

/** « 2 km ». */
/** « 2 km », « 1,5 km ». */
export const libelleRayon = (metres: number): string =>
  `${String(metres / 1000).replace('.', ',')} km`;
