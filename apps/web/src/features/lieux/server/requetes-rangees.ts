import 'server-only';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';

import { lieuxDesGaresAtteintes, type FiltresAccessibles } from './requetes-accessibles';
import { colonnesPhoto, jointurePhoto, triPhotosDabord } from './requetes-photo';
import { schemaLigneLieuResume } from './resume';

const schemaRangee = z.object({
  gare_uic: z.string(),
  gare_nom: z.string(),
  duree_train_min: z.number().int(),
  total: z.coerce.number().int(),
  lieux: z.array(schemaLigneLieuResume),
});

const schemaResultat = z.object({
  total: z.coerce.number().int(),
  total_rangees: z.coerce.number().int(),
  rangees: z.array(schemaRangee),
});

/**
 * Rangées de l'onglet Lieux (D121) : une par gare d'arrivée ayant au moins un lieu avec ces filtres ;
 * si `photosDabord`, celles qui ont un lieu avec photo d'abord, puis la plus courte en train ; dans
 * chacune, ses `lieuxParRangee` premiers lieux (photo d'abord si `photosDabord`, puis la marche la plus
 * courte) et leur nombre. Un lieu à pied de deux gares est dans les deux rangées ; `total` le compte une
 * fois.
 */
export async function rangeesDeGares(
  options: FiltresAccessibles & {
    lieuxParRangee: number;
    rangees: number;
    decalage: number;
    /** Date du jour (Paris) : une photo se montre si ses droits sont en cours (D100). */
    datePhoto: string;
    /** Rangées avec une photo d'abord, et lieux avec une photo d'abord dans chacune (D104, temporaire). */
    photosDabord: boolean;
  },
): Promise<z.infer<typeof schemaResultat>> {
  const { rows } = await db.execute(sql`
    WITH candidats AS (
      SELECT lg.lieu_id, lg.distance_m, lg.duree_marche_min, ld.duree_min AS duree_train_min,
             g.uic AS gare_uic, g.nom AS gare_nom
      ${lieuxDesGaresAtteintes(options)}
    ),
    gares AS (
      SELECT c.gare_uic, c.gare_nom, c.duree_train_min, count(*) AS total,
             bool_or(p.lieu_id IS NOT NULL) AS avec_photo
      FROM candidats c JOIN lieu l ON l.id = c.lieu_id ${jointurePhoto(options.datePhoto)}
      GROUP BY c.gare_uic, c.gare_nom, c.duree_train_min
    ),
    -- L'ordre des rangées, écrit une seule fois : il sert à la page et à la réponse.
    page AS (
      SELECT *, row_number() OVER (
               ORDER BY ${options.photosDabord ? sql`NOT avec_photo, ` : sql``}duree_train_min, gare_nom, gare_uic
             ) AS ordre
      FROM gares
      ORDER BY ordre
      LIMIT ${options.rangees} OFFSET ${options.decalage}
    ),
    classes AS (
      SELECT c.gare_uic, l.cle, l.nom, l.categorie, l.sous_categorie, l.qualite_tourisme, l.source,
             ${colonnesPhoto}, ST_Y(l.geom::geometry) AS lat, ST_X(l.geom::geometry) AS lon,
             c.distance_m, c.duree_marche_min,
             row_number() OVER (
               PARTITION BY c.gare_uic
               ORDER BY ${triPhotosDabord(options.photosDabord)}c.duree_marche_min, l.cle
             ) AS rang
      FROM candidats c JOIN lieu l ON l.id = c.lieu_id ${jointurePhoto(options.datePhoto)}
      WHERE c.gare_uic IN (SELECT gare_uic FROM page)
    )
    SELECT (SELECT count(DISTINCT lieu_id) FROM candidats) AS total,
           (SELECT count(*) FROM gares) AS total_rangees,
           coalesce((
             SELECT jsonb_agg(
                      jsonb_build_object(
                        'gare_uic', p.gare_uic, 'gare_nom', p.gare_nom,
                        'duree_train_min', p.duree_train_min, 'total', p.total,
                        'lieux', (SELECT jsonb_agg(cl ORDER BY cl.rang) FROM classes cl
                                  WHERE cl.gare_uic = p.gare_uic AND cl.rang <= ${options.lieuxParRangee}))
                      ORDER BY p.ordre)
             FROM page p), '[]'::jsonb) AS rangees`);
  return schemaResultat.parse(rows[0]);
}
