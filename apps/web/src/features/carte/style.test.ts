import { describe, expect, it } from 'vitest';
import { colorierStyle, type Couche, type CouleursCarte } from './style';

const C: CouleursCarte = {
  land: 'terre',
  road: 'route',
  water: 'eau',
  green: 'vert',
  route: 'liaison',
  texte: 'texte',
  texteFort: 'fort',
  halo: 'halo',
};
const couche = (id: string, type: string): Couche | undefined =>
  colorierStyle({ layers: [{ id, type, paint: { garde: 1 } } as Couche] }, C).layers[0];

describe('colorierStyle', () => {
  it('peint le fond, l’eau, la verdure et les routes avec les tokens', () => {
    expect(couche('background', 'background')?.paint).toMatchObject({
      'background-color': 'terre',
    });
    expect(couche('water', 'fill')?.paint).toMatchObject({ 'fill-color': 'eau' });
    expect(couche('park', 'fill')?.paint).toMatchObject({
      'fill-color': 'vert',
      'fill-outline-color': 'vert',
    });
    expect(couche('road_minor', 'line')?.paint).toMatchObject({ 'line-color': 'route' });
  });

  it('garde les noms de lieux, masque les autres symboles', () => {
    expect(couche('label_city', 'symbol')?.paint).toMatchObject({ 'text-color': 'texte' });
    expect(couche('label_city', 'symbol')?.layout?.visibility).toBeUndefined();
    expect(couche('poi_r1', 'symbol')?.layout?.visibility).toBe('none');
  });

  it('masque les bâtiments, les bordures de route, le rail et le relief', () => {
    for (const [id, type] of [
      ['building-3d', 'fill-extrusion'],
      ['road_minor_casing', 'line'],
      ['road_major_rail', 'line'],
      ['natural_earth', 'raster'],
      ['landuse_school', 'fill'],
    ] as const) {
      expect(couche(id, type)?.layout?.visibility).toBe('none');
    }
  });

  it('remplace l’attribution des sources sans toucher à leurs adresses', () => {
    const style = colorierStyle(
      { layers: [], sources: { base: { url: 'https://x', attribution: 'autre' } } },
      C,
    );
    expect(style.sources).toEqual({ base: { url: 'https://x' } });
  });

  it('conserve le reste de la peinture d’une couche', () => {
    expect(couche('water', 'fill')?.paint).toMatchObject({ garde: 1 });
  });
});
