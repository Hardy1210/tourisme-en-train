// Lieux à pied d'une gare et fiche d'un lieu (docs/05-api.md § 3.6, § 3.7, D052).
import 'server-only';
import { ORIGINES_DESCRIPTION, schemaCategorie, type Categorie } from '@tourisme/commun';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';
import { filtreCategories } from '@/lib/db/filtre-categories';

import {
  colonnesPhoto,
  jointurePhoto,
  schemaColonnesPhoto,
  triPhotosDabord,
} from './requetes-photo';

const schemaLieuGare = schemaColonnesPhoto.extend({
  cle: z.string(),
  nom: z.string(),
  categorie: schemaCategorie,
  sous_categorie: z.string().nullable(),
  qualite_tourisme: z.boolean(),
  source: z.string(),
  lat: z.number(),
  lon: z.number(),
  distance_m: z.number().int(),
  duree_marche_min: z.number().int(),
  total: z.coerce.number().int(),
});

export type LieuGareBrut = z.infer<typeof schemaLieuGare>;

/** Lieux à pied d'une gare (`lieu_gare` : distance déjà mesurée à pied, D043), les plus proches d'abord. */
export async function lieuxDeLaGare(options: {
  gareId: number;
  rayonM: number;
  categories: readonly Categorie[] | null;
  limite: number;
  /** Date du jour (Paris) : une photo ne sort que si ses droits sont en cours (D100). */
  datePhoto: string;
  /** Lieux avec une photo d'abord (D104, temporaire). */
  photosDabord: boolean;
}): Promise<LieuGareBrut[]> {
  const { rows } = await db.execute(sql`
    SELECT l.cle, l.nom, l.categorie, l.sous_categorie, l.qualite_tourisme, l.source, ${colonnesPhoto},
           ST_Y(l.geom::geometry) AS lat, ST_X(l.geom::geometry) AS lon,
           lg.distance_m, lg.duree_marche_min, count(*) OVER () AS total
    FROM lieu_gare lg JOIN lieu l ON l.id = lg.lieu_id ${jointurePhoto(options.datePhoto)}
    WHERE lg.gare_id = ${options.gareId} AND lg.distance_m <= ${options.rayonM}
      AND l.doublon_de IS NULL AND l.site_de IS NULL
      AND ${filtreCategories(options.categories)}
    ORDER BY ${triPhotosDabord(options.photosDabord)}lg.distance_m, l.cle
    LIMIT ${options.limite}`);
  return z.array(schemaLieuGare).parse(rows);
}

const schemaLieu = schemaColonnesPhoto.extend({
  id: z.coerce.number().int(),
  cle: z.string(),
  nom: z.string(),
  categorie: schemaCategorie,
  sous_categorie: z.string().nullable(),
  description: z.string().nullable(),
  adresse: z.string().nullable(),
  commune: z.string().nullable(),
  url: z.string().nullable(),
  horaires: z.string().nullable(),
  periode: z.string().nullable(),
  qualite_tourisme: z.boolean(),
  source: z.string(),
  attribution: z.string(),
  lat: z.number(),
  lon: z.number(),
  doublon_de: z.coerce.number().int().nullable(),
  site_de: z.coerce.number().int().nullable(),
  /** Lignes de `description_lieu` (D123) : l'application choisit le texte (`choisirDescription`). */
  ajoutees: z.array(
    z.object({
      origine: z.enum(ORIGINES_DESCRIPTION),
      texte: z.string(),
      credit: z.string(),
      licence: z.string().nullable(),
      lien: z.string().nullable(),
    }),
  ),
});

export type LieuBrut = z.infer<typeof schemaLieu>;

const COLONNES_LIEU = sql`l.id, l.cle, l.nom, l.categorie, l.sous_categorie, l.description, l.adresse,
  c.nom AS commune, l.url, l.horaires, l.periode, l.qualite_tourisme, l.source,
  s.attribution, ST_Y(l.geom::geometry) AS lat, ST_X(l.geom::geometry) AS lon, l.doublon_de, l.site_de,
  ${colonnesPhoto},
  (SELECT coalesce(json_agg(json_build_object('origine', d.origine, 'texte', d.texte,
            'credit', d.credit, 'licence', d.licence, 'lien', d.lien) ORDER BY d.origine), '[]'::json)
   FROM description_lieu d WHERE d.lieu_id = l.id) AS ajoutees`;

async function lireLieu(
  condition: ReturnType<typeof sql>,
  datePhoto: string,
): Promise<LieuBrut | null> {
  const { rows } = await db.execute(sql`
    SELECT ${COLONNES_LIEU}
    FROM lieu l
    JOIN source_donnees s ON s.code = l.source
    LEFT JOIN commune c ON c.code_insee = l.code_insee
    ${jointurePhoto(datePhoto)}
    WHERE ${condition}`);
  return rows[0] ? schemaLieu.parse(rows[0]) : null;
}

export const lieuParCle = (cle: string, datePhoto: string): Promise<LieuBrut | null> =>
  lireLieu(sql`l.cle = ${cle}`, datePhoto);
export const lieuParId = (id: number, datePhoto: string): Promise<LieuBrut | null> =>
  lireLieu(sql`l.id = ${id}`, datePhoto);

const schemaGareProche = z.object({
  uic: z.string(),
  nom: z.string(),
  distance_m: z.number().int(),
  duree_marche_min: z.number().int(),
});

/** Gares d'où l'on rejoint ce lieu à pied (`lieu_gare`), la plus proche d'abord. */
export async function garesDuLieu(lieuId: number): Promise<z.infer<typeof schemaGareProche>[]> {
  const { rows } = await db.execute(sql`
    SELECT g.uic, g.nom, lg.distance_m, lg.duree_marche_min
    FROM lieu_gare lg JOIN gare g ON g.id = lg.gare_id
    WHERE lg.lieu_id = ${lieuId}
    ORDER BY lg.distance_m, g.uic`);
  return z.array(schemaGareProche).parse(rows);
}
