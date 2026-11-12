import { describe, expect, it } from 'vitest';
import { bloquerGeste, positionListe } from './blocage-geste';

// Liste défilable, au milieu : rien ne la retient.
const LISTE = { dansListe: true, defilable: true, enHaut: false, enBas: false };
const VERS_LE_BAS = 10; // le doigt tire vers le bas (remonter la liste)
const VERS_LE_HAUT = -10; // le doigt pousse vers le haut (descendre la liste)

describe('bloquerGeste (page plein écran)', () => {
  it('hors de la liste : bloqué (sinon le geste passe à la page derrière)', () => {
    expect(bloquerGeste({ ...LISTE, dansListe: false, deplacementY: VERS_LE_HAUT })).toBe(true);
  });

  it('liste trop courte pour défiler : bloqué ; liste qui défile : libre', () => {
    expect(bloquerGeste({ ...LISTE, defilable: false, deplacementY: VERS_LE_HAUT })).toBe(true);
    expect(bloquerGeste({ ...LISTE, deplacementY: VERS_LE_HAUT })).toBe(false);
  });

  it('tout en haut, doigt vers le bas : bloqué ; doigt vers le haut : libre', () => {
    expect(bloquerGeste({ ...LISTE, enHaut: true, deplacementY: VERS_LE_BAS })).toBe(true);
    expect(bloquerGeste({ ...LISTE, enHaut: true, deplacementY: VERS_LE_HAUT })).toBe(false);
  });

  it('tout en bas, doigt vers le haut : bloqué ; doigt vers le bas : libre', () => {
    expect(bloquerGeste({ ...LISTE, enBas: true, deplacementY: VERS_LE_HAUT })).toBe(true);
    expect(bloquerGeste({ ...LISTE, enBas: true, deplacementY: VERS_LE_BAS })).toBe(false);
  });

  it('au milieu de la liste, dans les deux sens : libre', () => {
    expect(bloquerGeste({ ...LISTE, deplacementY: VERS_LE_BAS })).toBe(false);
    expect(bloquerGeste({ ...LISTE, deplacementY: VERS_LE_HAUT })).toBe(false);
  });
});

describe('positionListe', () => {
  it('en haut à 0, en bas au dernier pixel (1 px d’arrondi toléré)', () => {
    expect(positionListe({ defilement: 0, hauteurVisible: 300, hauteurContenu: 600 })).toEqual({
      defilable: true,
      enHaut: true,
      enBas: false,
    });
    expect(positionListe({ defilement: 299, hauteurVisible: 300, hauteurContenu: 600 })).toEqual({
      defilable: true,
      enHaut: false,
      enBas: true,
    });
    expect(positionListe({ defilement: 150, hauteurVisible: 300, hauteurContenu: 600 })).toEqual({
      defilable: true,
      enHaut: false,
      enBas: false,
    });
  });

  it('contenu qui tient dans la zone (ou dépasse d’1 px) : pas défilable', () => {
    expect(
      positionListe({ defilement: 0, hauteurVisible: 300, hauteurContenu: 301 }).defilable,
    ).toBe(false);
    expect(
      positionListe({ defilement: 0, hauteurVisible: 300, hauteurContenu: 302 }).defilable,
    ).toBe(true);
  });
});
