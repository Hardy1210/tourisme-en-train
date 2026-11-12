// Page « Trajet » du téléphone (D085) : après un choix, passer à l'autre champ ou fermer.
import { describe, expect, it } from 'vitest';

import { apresChoix } from './enchainement-trajet';

describe('apresChoix', () => {
  it('départ choisi, destination vide : le curseur passe à la destination ; remplie : fermer', () => {
    expect(apresChoix({ champ: 'depart', departRempli: true, destinationRemplie: false })).toEqual({
      action: 'champ',
      champ: 'destination',
    });
    expect(apresChoix({ champ: 'depart', departRempli: true, destinationRemplie: true })).toEqual({
      action: 'fermer',
    });
  });

  it('destination choisie, départ connu : fermer ; départ inconnu : le curseur passe au départ', () => {
    expect(
      apresChoix({ champ: 'destination', departRempli: true, destinationRemplie: true }),
    ).toEqual({ action: 'fermer' });
    expect(
      apresChoix({ champ: 'destination', departRempli: false, destinationRemplie: true }),
    ).toEqual({ action: 'champ', champ: 'depart' });
  });
});
