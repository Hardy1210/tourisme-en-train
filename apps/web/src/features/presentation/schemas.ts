// Contrat de GET /api/sources (docs/05-api.md § 3.12, règle 8, D051).
import { z } from 'zod';

export const schemaSourceAffichee = z.object({
  code: z.string(),
  nom: z.string(),
  producteur: z.string(),
  page: z.string(),
  licence: z.string(),
  /** Texte exigé par la licence (ODbL : « © les contributeurs d'OpenStreetMap »). */
  attribution: z.string(),
  /** Date des données (Paris) : dernier chargement, relevé ou calibrage ; null pour un service en direct. */
  dateDonnees: z.iso.date().nullable(),
});

export const schemaReponseSources = z.object({
  sources: z.array(schemaSourceAffichee),
  /** Dates couvertes par les horaires chargés ; null si aucun. Borne le calendrier de l'écran Explorer. */
  horaires: z.object({ debut: z.iso.date(), fin: z.iso.date() }).nullable(),
});

export type ReponseSources = z.infer<typeof schemaReponseSources>;
