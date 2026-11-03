// Repli hors ligne de la recherche de ville : gares et communes des gares en base (D022, D051).
import 'server-only';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';

const schemaGareCommune = z.object({
  gare: z.string(),
  commune: z.string(),
  code_insee: z.string().nullable(),
  lat: z.number(),
  lon: z.number(),
});

export type GareCommune = z.infer<typeof schemaGareCommune>;

/**
 * Gares dont le nom ou la commune contient le texte (sans accents ni majuscules), celles de la région
 * d'abord. `position()` plutôt que `LIKE` : le texte tapé n'est jamais interprété comme un motif.
 */
export async function garesParNom(texte: string, limite: number): Promise<GareCommune[]> {
  const { rows } = await db.execute(sql`
    SELECT g.nom AS gare, coalesce(c.nom, g.nom) AS commune, g.code_insee,
           ST_Y(g.geom::geometry) AS lat, ST_X(g.geom::geometry) AS lon
    FROM gare g LEFT JOIN commune c ON c.code_insee = g.code_insee
    WHERE position(unaccent(lower(${texte})) IN unaccent(lower(g.nom))) > 0
       OR position(unaccent(lower(${texte})) IN unaccent(lower(coalesce(c.nom, '')))) > 0
    ORDER BY g.dans_region DESC,
             position(unaccent(lower(${texte})) IN unaccent(lower(coalesce(c.nom, g.nom)))) = 1 DESC,
             g.nom
    LIMIT ${limite}`);
  return z.array(schemaGareCommune).parse(rows);
}

/** Commune de la gare la plus proche d'un point (repli de la recherche inverse). */
export async function communeDeLaGareLaPlusProche(
  lat: number,
  lon: number,
): Promise<GareCommune | null> {
  const point = sql`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography`;
  const { rows } = await db.execute(sql`
    SELECT g.nom AS gare, coalesce(c.nom, g.nom) AS commune, g.code_insee,
           ST_Y(g.geom::geometry) AS lat, ST_X(g.geom::geometry) AS lon
    FROM gare g LEFT JOIN commune c ON c.code_insee = g.code_insee
    ORDER BY g.geom <-> ${point} LIMIT 1`);
  return rows[0] ? schemaGareCommune.parse(rows[0]) : null;
}
