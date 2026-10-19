// LE SEUL schéma de config/sources.json (docs/04-traitement-donnees.md § 2 bis).
// Aucune adresse de source n'est écrite dans le code : elles vivent toutes dans ce fichier (D027).
import { z } from 'zod';
import sourcesBrutes from '../../../config/sources.json' with { type: 'json' };

const schemaSource = z.strictObject({
  code: z.string().regex(/^[a-z][a-z0-9_]*$/, 'Code attendu en snake_case'),
  nom: z.string().min(1),
  producteur: z.string().min(1),
  /** base = téléchargé et stocké par l'ETL ; direct = appelé par le serveur ; local = valeurs recopiées. */
  mode: z.enum(['base', 'direct', 'local']),
  /** Page de présentation de la source (affichée dans l'écran « Sources »). */
  page: z.url({ protocol: /^https$/ }),
  /** Adresse du fichier à télécharger ; null tant que l'étape de la source ne l'a pas relevée. */
  telechargement: z.url({ protocol: /^https$/ }).nullable(),
  licence: z.string().min(1),
  attribution: z.string().min(1),
  /** false = adresse et licence pas encore vérifiées sur la vraie source (à faire à son étape). */
  verifie: z.boolean(),
});

export const schemaSources = z
  .strictObject({
    version: z.literal(1),
    sources: z.array(schemaSource).min(1),
  })
  .refine((s) => new Set(s.sources.map((source) => source.code)).size === s.sources.length, {
    message: 'Chaque code de source doit être unique.',
    path: ['sources'],
  });

export type SourceDonnees = z.infer<typeof schemaSource>;
export type Sources = z.infer<typeof schemaSources>;

/** Sources validées au chargement : un fichier invalide arrête l'application ou le traitement. */
export const sources: Sources = schemaSources.parse(sourcesBrutes);

/** Renvoie la source demandée ; lève une erreur si elle est absente de config/sources.json. */
export function trouverSource(code: string, liste: Sources = sources): SourceDonnees {
  const source = liste.sources.find((s) => s.code === code);
  if (!source) throw new Error(`Source « ${code} » absente de config/sources.json`);
  return source;
}
