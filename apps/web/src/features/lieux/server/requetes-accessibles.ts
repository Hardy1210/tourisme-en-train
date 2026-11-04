import 'server-only';
import { CATEGORIES, schemaCategorie, type Categorie } from '@tourisme/commun';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { parametres } from '@/config/parametres';
import { db } from '@/lib/db/client';

const { sousCategoriesRetirees, sousCategoriesNomPropreRequis } = parametres.lieux.ongletLieux;

const liste = (valeurs: readonly string[]) =>
  sql.join(
    valeurs.map((v) => sql`${v}`),
    sql`, `,
  );

const schemaLigne = z.object({
  cle: z.string(),
  nom: z.string(),
  categorie: schemaCategorie,
  sous_categorie: z.string().nullable(),
  image_url: z.string().nullable(),
  qualite_tourisme: z.boolean(),
  source: z.string(),
  lat: z.number(),
  lon: z.number(),
  distance_m: z.number().int(),
  duree_marche_min: z.number().int(),
  duree_train_min: z.number().int(),
  gare_uic: z.string(),
  gare_nom: z.string(),
});

const schemaResultat = z.object({
  total: z.coerce.number().int(),
  lieux: z.array(schemaLigne),
});

export type LieuAccessibleBrut = z.infer<typeof schemaLigne>;

/**
 * Lieux à pied d'une gare atteinte en train direct, le temps total (train + marche) le plus court
 * d'abord (D056). Un lieu proche de plusieurs gares apparaît une fois, par la plus rapide. Les lieux
 * de la ville de départ sont écartés : à pied de la gare de départ, ou à côté d'une gare de sa commune.
 * Piscines ordinaires et aires de jeux sans nom propre sont réservées à « À deux pas » et à la fiche (D057).
 */
export async function lieuxAccessibles(options: {
  gareId: number;
  codeInsee: string | null;
  date: string;
  dureeMax: number;
  categories: readonly Categorie[] | null;
  limite: number;
  decalage: number;
}): Promise<z.infer<typeof schemaResultat>> {
  const categories = sql.join(
    (options.categories ?? CATEGORIES).map((c) => sql`${c}`),
    sql`, `,
  );
  const { rows } = await db.execute(sql`
    WITH candidats AS (
      SELECT DISTINCT ON (lg.lieu_id)
             lg.lieu_id, lg.distance_m, lg.duree_marche_min, ld.duree_min AS duree_train_min,
             g.uic AS gare_uic, g.nom AS gare_nom
      FROM liaison_directe ld
      JOIN gare g ON g.id = ld.gare_arrivee_id
      JOIN lieu_gare lg ON lg.gare_id = g.id
      JOIN lieu l ON l.id = lg.lieu_id
      WHERE ld.gare_depart_id = ${options.gareId} AND ld.date_service = ${options.date}
        AND ld.duree_min <= ${options.dureeMax}
        AND g.code_insee IS DISTINCT FROM ${options.codeInsee}
        AND l.doublon_de IS NULL AND l.site_de IS NULL
        AND l.categorie IN (${categories})
        AND coalesce(l.sous_categorie, '') NOT IN (${liste(sousCategoriesRetirees)})
        AND NOT (coalesce(l.sous_categorie, '') IN (${liste(sousCategoriesNomPropreRequis)})
                 AND lower(unaccent(l.nom)) = lower(unaccent(l.sous_categorie)))
        AND NOT EXISTS (SELECT 1 FROM lieu_gare depart
                        WHERE depart.lieu_id = lg.lieu_id AND depart.gare_id = ${options.gareId})
      ORDER BY lg.lieu_id, ld.duree_min + lg.duree_marche_min, g.uic
    ),
    page AS (
      SELECT l.cle, l.nom, l.categorie, l.sous_categorie, l.image_url, l.qualite_tourisme, l.source,
             ST_Y(l.geom::geometry) AS lat, ST_X(l.geom::geometry) AS lon,
             c.distance_m, c.duree_marche_min, c.duree_train_min, c.gare_uic, c.gare_nom
      FROM candidats c JOIN lieu l ON l.id = c.lieu_id
      ORDER BY c.duree_train_min + c.duree_marche_min, l.cle
      LIMIT ${options.limite} OFFSET ${options.decalage}
    )
    SELECT (SELECT count(*) FROM candidats) AS total,
           coalesce((SELECT jsonb_agg(page) FROM page), '[]'::jsonb) AS lieux`);
  return schemaResultat.parse(rows[0]);
}
