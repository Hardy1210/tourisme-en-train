import { describe, expect, it } from 'vitest';
import { listeSousMaPosition } from './liste-depart';

describe('listeSousMaPosition', () => {
  it('sans position : les grandes gares de la région', () => {
    expect(listeSousMaPosition({ positionConnue: false, nombreProches: 0 })).toBe('region');
  });

  it('avec la position : les gares proches, jamais les grandes gares', () => {
    expect(listeSousMaPosition({ positionConnue: true, nombreProches: 3 })).toBe('proches');
  });

  it('position connue, gares proches pas encore arrivées : rien, sans éclair des grandes gares', () => {
    expect(listeSousMaPosition({ positionConnue: true, nombreProches: 0 })).toBeNull();
  });
});
