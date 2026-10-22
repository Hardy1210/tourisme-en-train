import { describe, expect, it } from 'vitest';
import { decouperSections, lireSections, preparer } from '../src/transformations/sql';

describe('decouperSections', () => {
  it('une section par `-- @nom`, sans le point-virgule final ni les commentaires', () => {
    const sections = decouperSections(
      '-- en-tête ignoré\n-- @a\n-- commentaire :debut\nSELECT 1;\n\n-- @b\nSELECT 2\n',
    );
    expect([...sections]).toEqual([
      ['a', 'SELECT 1'],
      ['b', 'SELECT 2'],
    ]);
  });

  it('section en double → erreur', () => {
    expect(() => decouperSections('-- @a\nSELECT 1;\n-- @a\nSELECT 2;')).toThrow('en double');
  });
});

describe('preparer', () => {
  it(':nom → $k, même nom = même numéro', () => {
    expect(preparer('SELECT :a, :b, :a', { a: 1, b: 2 })).toEqual({
      texte: 'SELECT $1, $2, $1',
      valeurs: [1, 2],
    });
  });

  it('ne touche pas aux conversions ::type ni aux textes en majuscules', () => {
    const sql = "SELECT :debut::date, substring(s FROM '^StopPoint:OCE(.*)')";
    expect(preparer(sql, { debut: '2026-10-26' }).texte).toBe(
      "SELECT $1::date, substring(s FROM '^StopPoint:OCE(.*)')",
    );
  });

  it('paramètre sans valeur → erreur qui le nomme', () => {
    expect(() => preparer('SELECT :absent', {})).toThrow(':absent');
  });

  it('valeur fournie mais inutilisée : pas transmise', () => {
    expect(preparer('SELECT 1', { a: 1 }).valeurs).toEqual([]);
  });
});

describe('gtfs.sql', () => {
  it('se découpe et se prépare avec les paramètres prévus', async () => {
    const sections = await lireSections(
      new URL('../src/transformations/gtfs.sql', import.meta.url),
    );
    const valeurs = {
      debut: '2026-10-22',
      jours: 60,
      modes_ter: [],
      modes_tgv: [],
      modes_intercites: [],
      modes_exclus: [],
    };
    for (const sql of sections.values()) expect(() => preparer(sql, valeurs)).not.toThrow();
    expect([...sections.keys()]).toContain('inserer_passage');
  });
});
