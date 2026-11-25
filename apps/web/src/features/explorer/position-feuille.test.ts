import { describe, expect, it } from 'vitest';
import {
  apresGlissement,
  apresToucher,
  FENETRE_VITESSE_MS,
  hautSousLeDoigt,
  positionAuLacher,
  preneurDuGeste,
  PROJECTION_MS,
  SEUIL_GLISSEMENT_PX,
  vitesseAuLacher,
  type Crans,
} from './position-feuille';

// Téléphone de 844 px de haut, comme les parcours : feuille en haut, à moitié, en bas.
const CRANS: Crans = { plein: 0, milieu: 290, carte: 700 };

describe('apresGlissement', () => {
  it('monte vers le haut et descend vers le bas, d’un cran', () => {
    expect(apresGlissement('milieu', -SEUIL_GLISSEMENT_PX)).toBe('plein');
    expect(apresGlissement('milieu', SEUIL_GLISSEMENT_PX)).toBe('carte');
  });

  it('ignore un geste trop court', () => {
    expect(apresGlissement('milieu', SEUIL_GLISSEMENT_PX - 1)).toBe('milieu');
    expect(apresGlissement('milieu', 1 - SEUIL_GLISSEMENT_PX)).toBe('milieu');
  });

  it('s’arrête aux extrémités', () => {
    expect(apresGlissement('plein', -200)).toBe('plein');
    expect(apresGlissement('carte', 200)).toBe('carte');
  });
});

describe('apresToucher', () => {
  it('bascule entre le milieu et le plein écran', () => {
    expect(apresToucher('milieu')).toBe('plein');
    expect(apresToucher('plein')).toBe('milieu');
  });

  it('remonte la feuille depuis la carte plein écran', () => {
    expect(apresToucher('carte')).toBe('milieu');
  });
});

describe('preneurDuGeste', () => {
  it('un geste horizontal reste au navigateur (rangée « Près de vous »), un vertical va à la feuille', () => {
    expect(preneurDuGeste({ position: 'milieu', listeAuDebut: true, dx: 6, dy: 5 })).toBe(
      'navigateur',
    );
    expect(preneurDuGeste({ position: 'milieu', listeAuDebut: true, dx: 5, dy: 6 })).toBe(
      'feuille',
    );
  });

  it('à moitié ou en bas, la feuille prend aussi le geste vers le haut, liste défilée ou non', () => {
    expect(preneurDuGeste({ position: 'milieu', listeAuDebut: false, dx: 0, dy: -10 })).toBe(
      'feuille',
    );
    expect(preneurDuGeste({ position: 'carte', listeAuDebut: true, dx: 0, dy: -10 })).toBe(
      'feuille',
    );
  });

  it('tout en haut, vers le bas avec la liste à son début : la feuille redescend', () => {
    expect(preneurDuGeste({ position: 'plein', listeAuDebut: true, dx: 0, dy: 10 })).toBe(
      'feuille',
    );
    expect(preneurDuGeste({ position: 'plein', listeAuDebut: false, dx: 0, dy: 10 })).toBe(
      'navigateur',
    );
  });

  it('tout en haut, vers le haut : la liste défile, même à son début', () => {
    expect(preneurDuGeste({ position: 'plein', listeAuDebut: true, dx: 0, dy: -10 })).toBe(
      'navigateur',
    );
  });
});

describe('hautSousLeDoigt', () => {
  it('suit le doigt entre les deux extrémités', () => {
    expect(hautSousLeDoigt(CRANS, 290, -100)).toBe(190);
    expect(hautSousLeDoigt(CRANS, 290, 100)).toBe(390);
  });

  it('ne monte pas au-dessus du haut, ne descend pas sous le bas', () => {
    expect(hautSousLeDoigt(CRANS, 290, -400)).toBe(0);
    expect(hautSousLeDoigt(CRANS, 290, 500)).toBe(700);
  });
});

describe('vitesseAuLacher', () => {
  it('mesure le mouvement des derniers instants', () => {
    const points = [
      { y: 500, t: 1000 },
      { y: 450, t: 1050 },
      { y: 400, t: 1100 },
    ];
    expect(vitesseAuLacher(points, 1100)).toBe(-1);
  });

  it('ignore les points plus anciens que la fenêtre', () => {
    const points = [
      { y: 800, t: 1000 - FENETRE_VITESSE_MS - 1 },
      { y: 450, t: 1050 },
      { y: 400, t: 1100 },
    ];
    expect(vitesseAuLacher(points, 1100)).toBe(-1);
  });

  it('doigt arrêté avant le lâcher : vitesse nulle, même après un geste rapide', () => {
    const points = [
      { y: 500, t: 1000 },
      { y: 300, t: 1050 },
    ];
    expect(vitesseAuLacher(points, 1050 + FENETRE_VITESSE_MS + 1)).toBe(0);
  });

  it('un seul point : vitesse nulle', () => {
    expect(vitesseAuLacher([{ y: 500, t: 1000 }], 1000)).toBe(0);
  });
});

describe('positionAuLacher', () => {
  const milieuEntreMoitieEtBas = (CRANS.milieu + CRANS.carte) / 2;

  it('lâchée lentement : le cran le plus proche', () => {
    expect(positionAuLacher(CRANS, milieuEntreMoitieEtBas - 1, 0)).toBe('milieu');
    expect(positionAuLacher(CRANS, milieuEntreMoitieEtBas + 1, 0)).toBe('carte');
  });

  it('un coup rapide vers le haut depuis le bas va jusqu’en haut ; plus lent, il s’arrête à moitié', () => {
    expect(positionAuLacher(CRANS, 690, -3)).toBe('plein');
    expect(positionAuLacher(CRANS, 690, -1)).toBe('milieu');
  });

  it('un coup vers le bas l’emporte sur la position du lâcher', () => {
    const vitesse = (CRANS.milieu - 0) / PROJECTION_MS;
    expect(positionAuLacher(CRANS, 100, vitesse)).toBe('milieu');
    expect(positionAuLacher(CRANS, 100, 0)).toBe('plein');
  });

  it('ne dépasse jamais les extrémités', () => {
    expect(positionAuLacher(CRANS, 0, -10)).toBe('plein');
    expect(positionAuLacher(CRANS, 700, 10)).toBe('carte');
  });
});
