import { describe, expect, it } from 'vitest';

import { corrigerGeography } from './generer';

describe('corrigerGeography', () => {
  it('retire les guillemets du type geography', () => {
    expect(corrigerGeography('"geom" "geography(Point, 4326)" NOT NULL')).toBe(
      '"geom" geography(Point, 4326) NOT NULL',
    );
    expect(corrigerGeography('"geography(MultiLineString, 4326)"')).toBe(
      'geography(MultiLineString, 4326)',
    );
  });

  it('ne touche ni aux noms de colonnes ni aux autres types', () => {
    const sqlIntact = '"geography" text, "nom" "geometry(Point, 4326)", "geography_id" integer';
    expect(corrigerGeography(sqlIntact)).toBe(sqlIntact);
  });
});
