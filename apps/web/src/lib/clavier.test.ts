import { describe, expect, it } from 'vitest';
import { hauteurClavier } from './clavier';

describe('hauteurClavier', () => {
  it('sans clavier : 0', () => {
    expect(hauteurClavier({ hauteurFenetre: 750, hauteurVisible: 750, decalageHaut: 0 })).toBe(0);
  });

  it('clavier ouvert : la partie cachée en bas', () => {
    expect(hauteurClavier({ hauteurFenetre: 750, hauteurVisible: 414, decalageHaut: 0 })).toBe(336);
  });

  it('la page a glissé vers le haut : le décalage ne compte pas comme clavier', () => {
    expect(hauteurClavier({ hauteurFenetre: 750, hauteurVisible: 414, decalageHaut: 100 })).toBe(
      236,
    );
  });

  it('jamais négatif (partie visible plus grande, élan d’iOS)', () => {
    expect(hauteurClavier({ hauteurFenetre: 750, hauteurVisible: 760, decalageHaut: 0 })).toBe(0);
  });

  it('arrondi au pixel', () => {
    expect(hauteurClavier({ hauteurFenetre: 750, hauteurVisible: 414.6, decalageHaut: 0 })).toBe(
      335,
    );
  });
});
