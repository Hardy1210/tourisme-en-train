// Photo d'un lieu dans les requêtes (docs/05-api.md § 1.13, D100) : jointure sur `photo_lieu`, seulement si
// les droits sont en cours à la date donnée (date du jour à Paris, passée par la route : règle 3).
import 'server-only';
import { sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';

/** Colonnes ajoutées au SELECT, avec l'alias `p` posé par `jointurePhoto`. */
export const colonnesPhoto: SQL = sql`p.url_petite AS photo_petite, p.url_grande AS photo_grande,
  p.auteur AS photo_auteur, p.licence AS photo_licence, p.licence_url AS photo_licence_url,
  p.page AS photo_page, p.source AS photo_source`;

/** LEFT JOIN de la photo du lieu `l`, écartée si ses droits ne sont pas en cours ce jour-là. */
export function jointurePhoto(date: string): SQL {
  return sql`LEFT JOIN photo_lieu p ON p.lieu_id = l.id
    AND (p.droits_debut IS NULL OR p.droits_debut <= ${date}::date)
    AND (p.droits_fin IS NULL OR p.droits_fin >= ${date}::date)`;
}

export const schemaColonnesPhoto = z.object({
  photo_petite: z.string().nullable(),
  photo_grande: z.string().nullable(),
  photo_auteur: z.string().nullable(),
  photo_licence: z.string().nullable(),
  photo_licence_url: z.string().nullable(),
  photo_page: z.string().nullable(),
  photo_source: z.string().nullable(),
});
