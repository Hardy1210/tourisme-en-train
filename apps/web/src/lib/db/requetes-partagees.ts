// Requêtes utilisées par plusieurs fonctionnalités (docs/01-architecture.md § 4).
import 'server-only';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { ParametreInvalide } from '@/lib/http/erreurs';

import { db } from './client';

const schemaFenetre = z.object({ debut: z.iso.date().nullable(), fin: z.iso.date().nullable() });

export type Fenetre = { debut: string; fin: string };

/**
 * Dates couvertes par les liaisons directes chargées (`pnpm etl liaisons`) ; null si aucune.
 * Sert à refuser une date hors fenêtre (`400`, docs/05-api.md § 1.7) : destinations, trains (E09).
 */
export async function fenetreLiaisons(): Promise<Fenetre | null> {
  const { rows } = await db.execute(
    sql`SELECT min(date_service)::text AS debut, max(date_service)::text AS fin FROM liaison_directe`,
  );
  const { debut, fin } = schemaFenetre.parse(rows[0]);
  return debut && fin ? { debut, fin } : null;
}

const enFrancais = (date: string): string => date.split('-').reverse().join('/');

/** `400` au message clair si `date` est hors des horaires chargés (docs/05-api.md § 1.7). */
export async function verifierDateDansFenetre(date: string): Promise<void> {
  const fenetre = await fenetreLiaisons();
  if (fenetre === null) throw new ParametreInvalide('Aucun horaire n’est chargé pour le moment.');
  if (date < fenetre.debut || date > fenetre.fin) {
    throw new ParametreInvalide(
      `Les horaires sont disponibles du ${enFrancais(fenetre.debut)} au ${enFrancais(fenetre.fin)}.`,
    );
  }
}

const schemaGare = z.object({
  id: z.number().int(),
  uic: z.string(),
  nom: z.string(),
  dans_region: z.boolean(),
  /** Commune de rattachement (nom + département), null si inconnue (D047). */
  cle_commune: z.string().nullable(),
  commune: z.string().nullable(),
  code_insee: z.string().nullable(),
  lat: z.number(),
  lon: z.number(),
});

export type GareResolue = z.infer<typeof schemaGare>;

/**
 * Gare désignée par un code UIC (D052), cherché parmi **tous** ses codes (`codes_uic`, index GIN) :
 * le code principal peut changer d'un chargement à l'autre (D039), la gare non. null si inconnue.
 */
export async function gareParUic(uic: string): Promise<GareResolue | null> {
  const { rows } = await db.execute(sql`
    SELECT g.id, g.uic, g.nom, g.dans_region, c.nom || '|' || c.departement AS cle_commune,
           c.nom AS commune, g.code_insee, ST_Y(g.geom::geometry) AS lat, ST_X(g.geom::geometry) AS lon
    FROM gare g LEFT JOIN commune c ON c.code_insee = g.code_insee
    WHERE g.codes_uic @> ARRAY[${uic}]::char(8)[]`);
  return rows[0] ? schemaGare.parse(rows[0]) : null;
}
