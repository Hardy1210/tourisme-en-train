import 'server-only';
import { type Categorie } from '@tourisme/commun';
import { sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';

import { parametres } from '@/config/parametres';
import { db } from '@/lib/db/client';
import { filtreCategories } from '@/lib/db/filtre-categories';

import { colonnesPhoto, jointurePhoto, triPhotosDabord } from './requetes-photo';
import { schemaLigneLieuResume } from './resume';

// Lieux masqués (piscines…) : jamais dans `lieu_gare` (D093), rien à filtrer ici.
const { sousCategoriesNomPropreRequis } = parametres.lieux.ongletLieux;

const liste = (valeurs: readonly string[]) =>
  sql.join(
    valeurs.map((v) => sql`${v}`),
    sql`, `,
  );

/** Filtres de l'onglet Lieux, communs à la liste (`lieuxAccessibles`) et aux rangées (D121). */
export type FiltresAccessibles = {
  gareId: number;
  codeInsee: string | null;
  date: string;
  dureeMax: number;
  categories: readonly Categorie[] | null;
};

/**
 * Lieux à pied des gares atteintes en train direct depuis `gareId` ce jour-là, filtres et exclusions de
 * l'onglet Lieux compris (D056, D057) : la liste et les rangées partent de ces mêmes lignes, écrites ici
 * une seule fois. Les lieux de la ville de départ sont écartés : à pied de la gare de départ, ou à côté
 * d'une gare de sa commune. Aires de jeux sans nom propre réservées à « Près de vous » et à la fiche.
 * Alias : `ld` (liaison), `g` (gare d'arrivée), `lg` (lieu_gare), `l` (lieu).
 */
export function lieuxDesGaresAtteintes(filtres: FiltresAccessibles): SQL {
  return sql`FROM liaison_directe ld
      JOIN gare g ON g.id = ld.gare_arrivee_id
      JOIN lieu_gare lg ON lg.gare_id = g.id
      JOIN lieu l ON l.id = lg.lieu_id
      WHERE ld.gare_depart_id = ${filtres.gareId} AND ld.date_service = ${filtres.date}
        AND ld.duree_min <= ${filtres.dureeMax}
        AND g.code_insee IS DISTINCT FROM ${filtres.codeInsee}
        AND l.doublon_de IS NULL AND l.site_de IS NULL
        AND ${filtreCategories(filtres.categories)}
        AND NOT (coalesce(l.sous_categorie, '') IN (${liste(sousCategoriesNomPropreRequis)})
                 AND lower(unaccent(l.nom)) = lower(unaccent(l.sous_categorie)))
        AND NOT EXISTS (SELECT 1 FROM lieu_gare depart
                        WHERE depart.lieu_id = lg.lieu_id AND depart.gare_id = ${filtres.gareId})`;
}

const schemaLigne = schemaLigneLieuResume.extend({
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
 * d'abord (D056). Un lieu proche de plusieurs gares apparaît une fois, par la plus rapide.
 */
export async function lieuxAccessibles(
  options: FiltresAccessibles & {
    limite: number;
    decalage: number;
    /** Date du jour (Paris), pas celle du trajet : une photo se montre si ses droits sont en cours (D100). */
    datePhoto: string;
    /** Lieux avec une photo d'abord, avant le LIMIT : une page entière en profite (D104, temporaire). */
    photosDabord: boolean;
  },
): Promise<z.infer<typeof schemaResultat>> {
  const { rows } = await db.execute(sql`
    WITH candidats AS (
      SELECT DISTINCT ON (lg.lieu_id)
             lg.lieu_id, lg.distance_m, lg.duree_marche_min, ld.duree_min AS duree_train_min,
             g.uic AS gare_uic, g.nom AS gare_nom
      ${lieuxDesGaresAtteintes(options)}
      ORDER BY lg.lieu_id, ld.duree_min + lg.duree_marche_min, g.uic
    ),
    page AS (
      SELECT l.cle, l.nom, l.categorie, l.sous_categorie, l.qualite_tourisme, l.source, ${colonnesPhoto},
             ST_Y(l.geom::geometry) AS lat, ST_X(l.geom::geometry) AS lon,
             c.distance_m, c.duree_marche_min, c.duree_train_min, c.gare_uic, c.gare_nom
      FROM candidats c JOIN lieu l ON l.id = c.lieu_id ${jointurePhoto(options.datePhoto)}
      ORDER BY ${triPhotosDabord(options.photosDabord)}c.duree_train_min + c.duree_marche_min, l.cle
      LIMIT ${options.limite} OFFSET ${options.decalage}
    )
    SELECT (SELECT count(*) FROM candidats) AS total,
           coalesce((SELECT jsonb_agg(page) FROM page), '[]'::jsonb) AS lieux`);
  return schemaResultat.parse(rows[0]);
}
