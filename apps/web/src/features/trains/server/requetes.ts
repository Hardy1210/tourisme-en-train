import 'server-only';
import { schemaTypeTrain } from '@tourisme/commun';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';

const schemaLigne = z.object({
  trajet_ids: z.array(z.string()),
  depart_s: z.number().int(),
  arrivee_s: z.number().int(),
  type_train: schemaTypeTrain,
  numeros: z.array(z.string()),
  terminus_en_region: z.boolean(),
});

export type TrainBrut = z.infer<typeof schemaLigne>;

const schemaArret = z.object({
  uic: z.string(),
  nom: z.string(),
  lat: z.number(),
  lon: z.number(),
});

/** Les gares d'un train, de son passage à la gare de départ à son passage à la gare d'arrivée, dans l'ordre. */
export async function arretsEntre(options: {
  trajetId: string;
  departId: number;
  arriveeId: number;
  departS: number;
  arriveeS: number;
}): Promise<z.infer<typeof schemaArret>[]> {
  const { trajetId, departId, arriveeId, departS, arriveeS } = options;
  const { rows } = await db.execute(sql`
    SELECT g.uic, g.nom, ST_Y(g.geom::geometry) AS lat, ST_X(g.geom::geometry) AS lon
    FROM passage a
    JOIN passage b ON b.trajet_id = a.trajet_id AND b.sequence > a.sequence
    JOIN passage p ON p.trajet_id = a.trajet_id AND p.sequence BETWEEN a.sequence AND b.sequence
    JOIN gare g ON g.id = p.gare_id
    WHERE a.trajet_id = ${trajetId}
      AND a.gare_id = ${departId} AND a.depart_s = ${departS}
      AND b.gare_id = ${arriveeId} AND b.arrivee_s = ${arriveeS}
    ORDER BY p.sequence`);
  return z.array(schemaArret).parse(rows);
}

/**
 * Tous les trains directs `departId → arriveeId` à `date`, dans l'ordre des départs (docs/03 § 5).
 * Trajets aux mêmes heures de départ et d'arrivée réunis (jumelage, D040) ; montée et descente
 * interdites respectées (D036). `terminus_en_region` : premier et dernier arrêt de **chaque** trajet
 * réuni dans la région (D082) ; un seul trajet qui en sort suffit à le rendre faux.
 */
export async function trainsDirects(
  departId: number,
  arriveeId: number,
  date: string,
): Promise<TrainBrut[]> {
  const { rows } = await db.execute(sql`
    SELECT array_agg(a.trajet_id ORDER BY a.trajet_id) AS trajet_ids, a.depart_s, b.arrivee_s,
           (array_agg(t.type_train ORDER BY t.type_train))[1] AS type_train,
           coalesce(array_agg(DISTINCT t.numero) FILTER (WHERE t.numero IS NOT NULL), '{}') AS numeros,
           bool_and(debut.dans_region AND fin.dans_region) AS terminus_en_region
    FROM passage a
    JOIN passage b ON b.trajet_id = a.trajet_id AND b.sequence > a.sequence
    JOIN trajet t ON t.id = a.trajet_id
    JOIN service_jour s ON s.service_id = t.service_id AND s.date_service = ${date}
    CROSS JOIN LATERAL (
      SELECT g.dans_region FROM passage p JOIN gare g ON g.id = p.gare_id
      WHERE p.trajet_id = a.trajet_id ORDER BY p.sequence LIMIT 1) debut
    CROSS JOIN LATERAL (
      SELECT g.dans_region FROM passage p JOIN gare g ON g.id = p.gare_id
      WHERE p.trajet_id = a.trajet_id ORDER BY p.sequence DESC LIMIT 1) fin
    WHERE a.gare_id = ${departId} AND b.gare_id = ${arriveeId}
      AND a.depart_s IS NOT NULL AND b.arrivee_s IS NOT NULL
      AND NOT a.montee_interdite AND NOT b.descente_interdite
    GROUP BY a.depart_s, b.arrivee_s
    ORDER BY a.depart_s, b.arrivee_s`);
  return z.array(schemaLigne).parse(rows);
}
