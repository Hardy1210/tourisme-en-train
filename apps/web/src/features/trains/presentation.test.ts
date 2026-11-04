import { describe, expect, it } from 'vitest';
import { formaterHeure, libelleTrain, lignesRetour } from './presentation';
import type { Train } from './schemas';

const train = (id: string): Train => ({
  trajetIds: [id],
  depart: { s: 36000, texte: '10:00', lendemain: false },
  arrivee: { s: 37000, texte: '10:16', lendemain: false },
  dureeMin: 16,
  typeTrain: 'TER',
  numeros: [],
});

describe('formaterHeure', () => {
  it('marque une heure après minuit', () => {
    expect(formaterHeure({ texte: '00:35', lendemain: true })).toBe('00:35 (+1)');
  });
  it('ne marque pas une heure de la journée', () => {
    expect(formaterHeure({ texte: '23:59', lendemain: false })).toBe('23:59');
  });
});

describe('libelleTrain', () => {
  it('assemble les numéros des trains en jumelage', () => {
    expect(libelleTrain({ typeTrain: 'TGV', numeros: ['12177', '5537'] })).toBe('TGV 12177 / 5537');
  });
  it('se limite au type sans numéro connu', () => {
    expect(libelleTrain({ typeTrain: 'INTERCITES', numeros: [] })).toBe('Intercités');
  });
});

describe('lignesRetour', () => {
  it('marque le dernier retour quand il est dans la liste', () => {
    const lignes = lignesRetour([train('a'), train('b')], train('b'));
    expect(lignes.map((l) => l.dernier)).toEqual([false, true]);
  });
  it('ajoute le dernier retour quand la limite l’a écarté', () => {
    const lignes = lignesRetour([train('a')], train('z'));
    expect(lignes.map((l) => [l.train.trajetIds[0], l.dernier])).toEqual([
      ['a', false],
      ['z', true],
    ]);
  });
  it('n’ajoute rien quand il n’y a aucun retour à prendre', () => {
    expect(lignesRetour([], train('z'))).toEqual([]);
  });
});
