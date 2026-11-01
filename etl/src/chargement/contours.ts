// Contours des communes de la région (docs/04-traitement-donnees.md § 4.0 bis, D041) : GeoJSON de
// geo.api.gouv.fr → `commune.contour`. Le contour décrit la commune : il vit dans `commune`, jamais
// copié dans `lieu`. Les communes absentes du fichier perdent leur contour (sorties de la région).
import type pg from 'pg';
import { z } from 'zod';
import { parametres } from '../config';
import { aucune, auMoins, type Controle } from '../controles/base';

export const schemaContours = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(
    z.object({
      properties: z.object({ code: z.string().regex(/^(\d{5}|2[AB]\d{3})$/), nom: z.string() }),
      geometry: z.object({ type: z.enum(['Polygon', 'MultiPolygon']) }).loose(),
    }),
  ),
});

export const TABLE_TEMPORAIRE = {
  nom: 'tmp_contour',
  colonnes: [
    ['code_insee', 'char(5)'],
    ['nom', 'text'],
    ['geojson', 'text'],
  ],
} as const;

export const CONTROLES: readonly Controle[] = [
  auMoins(
    'Communes avec contour',
    'SELECT count(*)::int AS n FROM tmp_contour',
    parametres.controles.contoursRegionMin,
  ),
  // Une commune absente de `commune` perdrait ses lieux en silence (aucun contour pour les y rattacher).
  aucune(
    'Contours dont la commune est absente de la table commune (pnpm etl communes ?)',
    `SELECT count(*)::int AS n FROM tmp_contour t
     WHERE NOT EXISTS (SELECT 1 FROM commune c WHERE c.code_insee = t.code_insee)`,
  ),
  aucune(
    'Contours en double',
    `SELECT count(*)::int AS n FROM (
       SELECT 1 FROM tmp_contour GROUP BY code_insee HAVING count(*) > 1) d`,
  ),
  aucune(
    'Contours hors des départements de la région',
    `SELECT count(*)::int AS n FROM tmp_contour t JOIN commune c USING (code_insee)
     WHERE NOT trim(c.departement) = ANY($1::text[])`,
    [parametres.region.departements],
    false,
  ),
];

export async function fusionnerContours(
  client: pg.ClientBase,
): Promise<{ chargees: number; retires: number }> {
  const retires = await client.query(
    `UPDATE commune c SET contour = NULL WHERE c.contour IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM tmp_contour t WHERE t.code_insee = c.code_insee)`,
  );
  // ST_MakeValid peut rendre une collection : on n'en garde que les surfaces.
  const { rowCount } = await client.query(
    `UPDATE commune c SET contour =
       ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_GeomFromGeoJSON(t.geojson)), 3))::geography
     FROM tmp_contour t WHERE c.code_insee = t.code_insee`,
  );
  return { chargees: rowCount ?? 0, retires: retires.rowCount ?? 0 };
}
