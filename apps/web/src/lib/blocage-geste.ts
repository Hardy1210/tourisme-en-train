// Page plein écran (D085) : sur iPhone, un geste qui n'a rien à faire défiler passe à la page derrière,
// qui bouge et se laisse apercevoir. On le bloque, sauf dans une liste qui peut encore défiler dans le
// sens du doigt. Fonctions pures.

type Liste = { defilement: number; hauteurVisible: number; hauteurContenu: number };
export type PositionListe = { defilable: boolean; enHaut: boolean; enBas: boolean };

/** Un écart d'arrondi (1 px) ne compte pas. */
const TOLERANCE_PX = 1;

export function positionListe({
  defilement,
  hauteurVisible,
  hauteurContenu,
}: Liste): PositionListe {
  return {
    defilable: hauteurContenu - hauteurVisible > TOLERANCE_PX,
    enHaut: defilement <= 0,
    enBas: defilement + hauteurVisible >= hauteurContenu - TOLERANCE_PX,
  };
}

type Geste = PositionListe & {
  /** Le doigt est-il dans la zone qui défile ? */
  dansListe: boolean;
  /** Déplacement vertical du doigt : positif quand il tire vers le bas. */
  deplacementY: number;
};

/** Vrai : annuler le geste (`preventDefault`), il passerait à la page derrière. */
export function bloquerGeste({
  dansListe,
  defilable,
  enHaut,
  enBas,
  deplacementY,
}: Geste): boolean {
  if (!dansListe || !defilable) return true;
  if (enHaut && deplacementY > 0) return true;
  if (enBas && deplacementY < 0) return true;
  return false;
}
