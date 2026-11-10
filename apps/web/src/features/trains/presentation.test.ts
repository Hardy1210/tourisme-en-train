import { describe, expect, it } from 'vitest';
import { formaterHeure, libelleTrain, lignesRetour, trainsAVenir } from './presentation';
import type { Train } from './schemas';
import { parametres } from '@/config/parametres';

const train = (id: string): Train => ({
  trajetIds: [id],
  depart: { s: 36000, texte: '10:00', lendemain: false },
  arrivee: { s: 37000, texte: '10:16', lendemain: false },
  dureeMin: 16,
  typeTrain: 'TER',
  numeros: [],
  terminusEnRegion: true,
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
  const horsRegion = { terminusEnRegion: false };
  it('assemble les numéros des trains en jumelage', () => {
    expect(libelleTrain({ typeTrain: 'TGV', numeros: ['12177', '5537'], ...horsRegion })).toBe(
      'TGV 12177 / 5537',
    );
  });
  it('se limite au type sans numéro connu', () => {
    expect(libelleTrain({ typeTrain: 'INTERCITES', numeros: [], ...horsRegion })).toBe(
      'Intercités',
    );
  });
});

describe('libelleTrain : nom régional des TER (D082)', () => {
  it('TER dont les deux terminus sont dans la région → nom de la configuration', () => {
    expect(libelleTrain({ typeTrain: 'TER', numeros: ['17818'], terminusEnRegion: true })).toBe(
      `${parametres.region.nomTer} 17818`,
    );
  });
  it('TER dont un terminus est hors région → « TER »', () => {
    expect(libelleTrain({ typeTrain: 'TER', numeros: ['17810'], terminusEnRegion: false })).toBe(
      'TER 17810',
    );
  });
  it('TGV entièrement dans la région → reste « TGV »', () => {
    expect(libelleTrain({ typeTrain: 'TGV', numeros: ['6701'], terminusEnRegion: true })).toBe(
      'TGV 6701',
    );
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

describe('trainsAVenir', () => {
  const JOUR = '2026-11-18';
  const a = (heureActuelleS: number) => ({ dateDuJour: JOUR, heureActuelleS });
  const reponse = {
    date: JOUR,
    aller: [train('aller')],
    retour: [train('retour')],
    dernierRetour: train('dernier'),
  };

  it('garde les trains à l’heure exacte du départ', () => {
    const resultat = trainsAVenir(reponse, a(36_000));
    expect(resultat.aller).toHaveLength(1);
    expect(resultat.retour).toHaveLength(1);
    expect(resultat.dernierRetour).not.toBeNull();
  });
  it('retire les trains partis, une seconde après', () => {
    const resultat = trainsAVenir(reponse, a(36_001));
    expect(resultat.aller).toEqual([]);
    expect(resultat.retour).toEqual([]);
    expect(resultat.dernierRetour).toBeNull();
  });
});
