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
  /**
   * Réseau de transport sur place (E07, D046) : GTFS (bus, tram, car) ou GBFS (vélos). `fichiers` :
   * fichiers GTFS, ou `station_information.json` d'un GBFS ; `stationStatus` : disponibilité en direct (P1).
   */
  reseau: z
    .strictObject({
      format: z.enum(['gtfs', 'gbfs']),
      /** Type des arrêts d'un réseau GTFS sans tram : `CAR` pour les cars régionaux (Mobigo). */
      typeParDefaut: z.enum(['BUS', 'CAR']).default('BUS'),
      fichiers: z.array(z.url({ protocol: /^https$/ })).min(1),
      stationStatus: z.url({ protocol: /^https$/ }).optional(),
    })
    .optional(),
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

/** Licences reconnues pour un réseau de transport : un réseau sans licence reconnue n'est pas chargé (D046). */
export const LICENCES_RESEAU = ['Licence Ouverte 2.0', 'Licence Ouverte 1.0', 'ODbL'] as const;

/** Réseaux de transport sur place déclarés dans config/sources.json (E07, D046). */
export function reseaux(
  liste: Sources = sources,
): (SourceDonnees & { reseau: NonNullable<SourceDonnees['reseau']> })[] {
  return liste.sources.filter(
    (s): s is SourceDonnees & { reseau: NonNullable<SourceDonnees['reseau']> } =>
      s.reseau !== undefined,
  );
}
export type Sources = z.infer<typeof schemaSources>;

/** Sources validées au chargement : un fichier invalide arrête l'application ou le traitement. */
export const sources: Sources = schemaSources.parse(sourcesBrutes);

/** Renvoie la source demandée ; lève une erreur si elle est absente de config/sources.json. */
export function trouverSource(code: string, liste: Sources = sources): SourceDonnees {
  const source = liste.sources.find((s) => s.code === code);
  if (!source) throw new Error(`Source « ${code} » absente de config/sources.json`);
  return source;
}
