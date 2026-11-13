import { describe, expect, it } from 'vitest';
import type { ReponseLieuxCarte } from '@/features/lieux/schemas';
import { lieuxGeoJson } from './couche-lieux';

const LIEUX: ReponseLieuxCarte['lieux'] = [
  ['a', 47.3, 5.0, 'patrimoine', []],
  ['b', 47.1, 4.8, 'nature', ['enfants']],
  ['c', 46.9, 4.6, 'culture', []],
];
const cles = (categories: Parameters<typeof lieuxGeoJson>[1]) =>
  lieuxGeoJson(LIEUX, categories).features.map((f) => f.properties.cle);

describe('lieuxGeoJson (D091)', () => {
  it('sans catégorie : tous les lieux, position [longitude, latitude]', () => {
    expect(cles([])).toEqual(['a', 'b', 'c']);
    expect(lieuxGeoJson(LIEUX, []).features[0]?.geometry.coordinates).toEqual([5.0, 47.3]);
  });

  it('une catégorie garde aussi les lieux qui l’ont en secondaire (D060), et seulement eux', () => {
    expect(cles(['enfants'])).toEqual(['b']);
    expect(cles(['patrimoine', 'culture'])).toEqual(['a', 'c']);
  });
});
