// Positions de la feuille de résultats sur mobile : décisions pures à partir d'un geste.
export type PositionFeuille = 'carte' | 'milieu' | 'plein';

const ORDRE: readonly PositionFeuille[] = ['carte', 'milieu', 'plein'];

/** Écart en pixels d'un cran au clavier (↑ ↓ sur la poignée). */
export const SEUIL_GLISSEMENT_PX = 40;

// Réglages du glissement au doigt (④, D120) : valeurs de départ, à juger sur l'iPhone.
/** En deçà, le doigt n'a pas glissé : c'est un toucher, qui ouvre ce qu'il touche. */
export const SEUIL_DEPLACEMENT_PX = 8;
/** La vitesse du doigt se mesure sur ses derniers instants avant le lâcher. */
export const FENETRE_VITESSE_MS = 100;
/** Au lâcher, la feuille vise où l'aurait portée sa vitesse pendant ce temps. */
export const PROJECTION_MS = 200;

/** Haut de la feuille, en pixels depuis le haut de son cadre, pour chaque position. */
export type Crans = Record<PositionFeuille, number>;

/** Un instant du geste : hauteur du doigt et heure de l'événement, en millisecondes. */
export type PointGeste = { y: number; t: number };

/** Position après un glissement au clavier : vers le haut (écart négatif) la feuille monte d'un cran. */
export function apresGlissement(position: PositionFeuille, ecartPx: number): PositionFeuille {
  if (Math.abs(ecartPx) < SEUIL_GLISSEMENT_PX) return position;
  const index = ORDRE.indexOf(position) + (ecartPx < 0 ? 1 : -1);
  return ORDRE[Math.max(0, Math.min(ORDRE.length - 1, index))] ?? position;
}

/** Un toucher ou la touche Entrée sur la poignée : le plein écran se replie, sinon la feuille monte. */
export function apresToucher(position: PositionFeuille): PositionFeuille {
  return position === 'plein' ? 'milieu' : position === 'milieu' ? 'plein' : 'milieu';
}

/**
 * Qui prend un geste commencé sur la feuille, décidé à son premier mouvement :
 * horizontal, le navigateur (rangée « Près de vous ») ; vertical, la feuille, sauf tout en haut,
 * où la liste défile, et où seul un geste vers le bas avec la liste à son début redescend la feuille.
 */
export function preneurDuGeste(geste: {
  position: PositionFeuille;
  listeAuDebut: boolean;
  dx: number;
  dy: number;
}): 'feuille' | 'navigateur' {
  if (Math.abs(geste.dx) > Math.abs(geste.dy)) return 'navigateur';
  if (geste.position !== 'plein') return 'feuille';
  return geste.listeAuDebut && geste.dy > 0 ? 'feuille' : 'navigateur';
}

/** Haut de la feuille sous le doigt : jamais plus haut que « plein », ni plus bas que « carte ». */
export function hautSousLeDoigt(crans: Crans, hautDepart: number, dy: number): number {
  return Math.min(crans.carte, Math.max(crans.plein, hautDepart + dy));
}

/** Vitesse du doigt au lâcher, en pixels par milliseconde (négative vers le haut) ; immobile : 0. */
export function vitesseAuLacher(points: readonly PointGeste[], lacherMs: number): number {
  const recents = points.filter((point) => lacherMs - point.t <= FENETRE_VITESSE_MS);
  const premier = recents[0];
  const dernier = recents.at(-1);
  if (!premier || !dernier || dernier.t === premier.t) return 0;
  return (dernier.y - premier.y) / (dernier.t - premier.t);
}

/** Position au lâcher : le cran le plus proche de l'endroit où la vitesse porterait la feuille. */
export function positionAuLacher(crans: Crans, haut: number, vitesse: number): PositionFeuille {
  const vise = haut + vitesse * PROJECTION_MS;
  const ecart = (position: PositionFeuille) => Math.abs(crans[position] - vise);
  return ORDRE.reduce((proche, position) => (ecart(position) < ecart(proche) ? position : proche));
}
