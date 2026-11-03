import 'server-only';
import { CATEGORIES, schemaCategorie, schemaTypeTrain, type Categorie } from '@tourisme/commun';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';

/** Clé de la commune de rattachement (nom + département ; arrondissements = « Paris ») ; null si inconnue. */
const CLE_COMMUNE = sql`c.nom || '|' || c.departement`;

const schemaGareAtteinte = z.object({
  gare_id: z.number().int(),
  uic: z.string(),
  nom: z.string(),
  lat: z.number(),
  lon: z.number(),
  dans_region: z.boolean(),
  cle_commune: z.string().nullable(),
  /** Nom de la commune ; null si inconnue. */
  commune: z.string().nullable(),
  code_insee: z.string().nullable(),
  duree_min: z.number().int(),
  nb_trains: z.number().int(),
  premier_depart_s: z.number().int(),
  dernier_retour_s: z.number().int().nullable(),
  types_train: z.array(schemaTypeTrain),
  distance_km: z.coerce.number(),
  faisable_journee: z.boolean(),
  lieux: z.partialRecord(schemaCategorie, z.number().int()),
});

export type GareAtteinteBrute = z.infer<typeof schemaGareAtteinte>;

const schemaLiaison = z.object({
  duree_min: z.number().int(),
  nb_trains: z.number().int(),
  premier_depart_s: z.number().int(),
  dernier_retour_s: z.number().int().nullable(),
  types_train: z.array(schemaTypeTrain),
  distance_km: z.coerce.number(),
  faisable_journee: z.boolean(),
});

export type LiaisonBrute = z.infer<typeof schemaLiaison>;

/** Liaison directe `departId → arriveeId` à `date`, avec son dernier retour (D040) ; null si aucune. */
export async function liaisonEntre(
  departId: number,
  arriveeId: number,
  date: string,
): Promise<LiaisonBrute | null> {
  const { rows } = await db.execute(sql`
    SELECT l.duree_min, l.nb_trains, l.premier_depart_s, r.dernier_depart_s AS dernier_retour_s,
           l.types_train, l.distance_km, l.faisable_journee
    FROM liaison_directe l
    LEFT JOIN liaison_directe r ON r.gare_depart_id = l.gare_arrivee_id
      AND r.gare_arrivee_id = l.gare_depart_id AND r.date_service = l.date_service
    WHERE l.gare_depart_id = ${departId} AND l.gare_arrivee_id = ${arriveeId}
      AND l.date_service = ${date}`);
  return rows[0] ? schemaLiaison.parse(rows[0]) : null;
}

const schemaLieuxParCategorie = z.object({
  lieux: z.partialRecord(schemaCategorie, z.number().int()),
});

/** Lieux à pied de la gare par catégorie (`gare_stats`), catégories non vides seulement. */
export async function lieuxParCategorie(
  gareId: number,
): Promise<Partial<Record<Categorie, number>>> {
  const { rows } = await db.execute(sql`
    SELECT coalesce(jsonb_object_agg(categorie, nb_lieux), '{}'::jsonb) AS lieux
    FROM gare_stats WHERE gare_id = ${gareId} AND nb_lieux > 0`);
  return schemaLieuxParCategorie.parse(rows[0]).lieux;
}

/**
 * Une ligne par gare d'arrivée en train direct depuis `gareId` à `date` (docs/03 § 5) : liaison,
 * dernier retour (liaison inverse, D040), commune, lieux à pied par catégorie (`gare_stats`).
 */
export async function garesAtteintes(options: {
  gareId: number;
  date: string;
  dureeMax: number;
  categories: readonly Categorie[] | null;
}): Promise<GareAtteinteBrute[]> {
  const categories = sql.join(
    (options.categories ?? CATEGORIES).map((c) => sql`${c}`),
    sql`, `,
  );
  const { rows } = await db.execute(sql`
    SELECT g.id AS gare_id, g.uic, g.nom, ST_Y(g.geom::geometry) AS lat, ST_X(g.geom::geometry) AS lon,
           g.dans_region, ${CLE_COMMUNE} AS cle_commune, c.nom AS commune, g.code_insee,
           l.duree_min, l.nb_trains, l.premier_depart_s, r.dernier_depart_s AS dernier_retour_s,
           l.types_train, l.distance_km, l.faisable_journee,
           coalesce((SELECT jsonb_object_agg(s.categorie, s.nb_lieux) FROM gare_stats s
                     WHERE s.gare_id = g.id AND s.nb_lieux > 0 AND s.categorie IN (${categories})),
                    '{}'::jsonb) AS lieux
    FROM liaison_directe l
    JOIN gare g ON g.id = l.gare_arrivee_id
    LEFT JOIN commune c ON c.code_insee = g.code_insee
    LEFT JOIN liaison_directe r ON r.gare_depart_id = l.gare_arrivee_id
      AND r.gare_arrivee_id = l.gare_depart_id AND r.date_service = l.date_service
    WHERE l.gare_depart_id = ${options.gareId} AND l.date_service = ${options.date}
      AND l.duree_min <= ${options.dureeMax}`);
  return z.array(schemaGareAtteinte).parse(rows);
}

const schemaProchain = z.object({
  gare_id: z.number().int(),
  depart_s: z.number().int(),
  arrivee_s: z.number().int(),
});

export type ProchainTrain = z.infer<typeof schemaProchain>;

/**
 * Prochain train direct vers chacune des gares `arriveeIds` à partir de `depuisS`, en **une seule
 * requête** pour toute la réponse (D040) ; montée et descente interdites respectées (D036).
 */
export async function prochainsTrains(options: {
  gareId: number;
  date: string;
  arriveeIds: readonly number[];
  depuisS: number;
}): Promise<ProchainTrain[]> {
  if (options.arriveeIds.length === 0) return [];
  const arrivees = sql.join(
    options.arriveeIds.map((id) => sql`${id}`),
    sql`, `,
  );
  const { rows } = await db.execute(sql`
    SELECT DISTINCT ON (b.gare_id) b.gare_id, a.depart_s, b.arrivee_s
    FROM passage a
    JOIN passage b ON b.trajet_id = a.trajet_id AND b.sequence > a.sequence
    JOIN trajet t ON t.id = a.trajet_id
    JOIN service_jour s ON s.service_id = t.service_id AND s.date_service = ${options.date}
    WHERE a.gare_id = ${options.gareId} AND b.gare_id IN (${arrivees})
      AND a.depart_s >= ${options.depuisS}
      AND NOT a.montee_interdite AND NOT b.descente_interdite
      AND b.arrivee_s IS NOT NULL
    ORDER BY b.gare_id, a.depart_s, b.arrivee_s`);
  return z.array(schemaProchain).parse(rows);
}
