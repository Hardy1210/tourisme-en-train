import { describe, expect, it } from 'vitest';
import { sectionPresDe } from './pres-de';

describe('sectionPresDe', () => {
  it('position connue, sans destination : « Près de vous », en haut', () => {
    expect(
      sectionPresDe({ origine: 'position', gareDepart: 'Dijon-Ville', destination: null }),
    ).toEqual({
      autour: 'depart',
      emplacement: 'haut',
      titre: 'Près de vous',
    });
  });

  it('gare de départ choisie, sans destination : le nom de la gare', () => {
    expect(sectionPresDe({ origine: 'choix', gareDepart: 'Beaune', destination: null }).titre).toBe(
      'Près de la gare de Beaune',
    );
  });

  it('destination choisie : en bas, autour de sa gare, même avec la position connue', () => {
    expect(
      sectionPresDe({
        origine: 'position',
        gareDepart: 'Dijon-Ville',
        destination: { uic: '87713545', gare: 'Beaune' },
      }),
    ).toEqual({
      autour: 'destination',
      emplacement: 'bas',
      titre: 'Près de la gare de Beaune',
      uic: '87713545',
    });
  });
});
