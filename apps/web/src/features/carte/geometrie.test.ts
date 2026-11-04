import { describe, expect, it } from 'vitest';
import {
  clesEtiquetees,
  empriseDe,
  pointsCadrage,
  pointsEtiquettes,
  segmentsDepuis,
} from './geometrie';

describe('empriseDe', () => {
  it('englobe tous les points', () => {
    expect(
      empriseDe([
        { lat: 47, lon: 5 },
        { lat: 46, lon: 6 },
        { lat: 48, lon: 4 },
      ]),
    ).toEqual([
      [4, 46],
      [6, 48],
    ]);
  });

  it('ne renvoie rien sans point', () => {
    expect(empriseDe([])).toBeNull();
  });
});

describe('segmentsDepuis', () => {
  it('trace un segment longitude, latitude par destination', () => {
    const { features } = segmentsDepuis({ lat: 47, lon: 5 }, [{ lat: 46, lon: 4 }]);
    expect(features[0]?.geometry.coordinates).toEqual([
      [5, 47],
      [4, 46],
    ]);
  });

  it('ne trace rien sans destination', () => {
    expect(segmentsDepuis({ lat: 47, lon: 5 }, []).features).toEqual([]);
  });
});

describe('clesEtiquetees', () => {
  const LISTE = [
    { uic: 'loin', dureeMin: 90 },
    { uic: 'proche', dureeMin: 10 },
    { uic: 'moyen', dureeMin: 40 },
  ];

  it('garde les plus proches, pas les autres', () => {
    expect([...clesEtiquetees(LISTE, null, 2)].sort()).toEqual(['moyen', 'proche']);
  });

  it('étiquette toujours la destination sélectionnée, même lointaine', () => {
    expect(clesEtiquetees(LISTE, 'loin', 1)).toEqual(new Set(['proche', 'loin']));
  });
});

describe('pointsCadrage', () => {
  const DEPART = { lat: 47, lon: 5 };
  const dest = (dureeMin: number) => ({ lat: 46, lon: 4, dureeMin });

  it('garde le départ et les destinations proches, pas Paris', () => {
    const points = pointsCadrage(DEPART, [dest(10), dest(30), dest(60), dest(94)], 60);
    expect(points).toHaveLength(4);
  });

  it('prend toutes les destinations s’il y en a trop peu de proches', () => {
    expect(pointsCadrage(DEPART, [dest(10), dest(94), dest(120)], 60)).toHaveLength(4);
  });
});

describe('pointsEtiquettes', () => {
  const LISTE = [
    { uic: 'A', lat: 46, lon: 4, etiquette: 'Beaune 22 min' },
    { uic: 'B', lat: 45, lon: 3, etiquette: 'Dole 30 min' },
  ];

  it('ne garde que les destinations étiquetées', () => {
    const { features } = pointsEtiquettes(LISTE, new Set(['A']), null);
    expect(features.map((f) => f.properties.etiquette)).toEqual(['Beaune 22 min']);
  });

  it('donne la priorité à la sélection dans les collisions', () => {
    const { features } = pointsEtiquettes(LISTE, new Set(['A', 'B']), 'B');
    expect(features.map((f) => f.properties.priorite)).toEqual([1, 0]);
  });
});
