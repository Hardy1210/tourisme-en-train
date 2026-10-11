// Vocabulaire métier partagé par l'application et le traitement des données (voir docs/GLOSSAIRE.md).
import { z } from 'zod';

export const CATEGORIES = ['enfants', 'nature', 'parcs', 'patrimoine', 'culture'] as const;
export const schemaCategorie = z.enum(CATEGORIES);
export type Categorie = z.infer<typeof schemaCategorie>;

export const TYPES_TRAIN = ['TER', 'INTERCITES', 'TGV', 'AUTRE'] as const;
export const schemaTypeTrain = z.enum(TYPES_TRAIN);
export type TypeTrain = z.infer<typeof schemaTypeTrain>;

export const TYPES_MOBILITE = ['BUS', 'TRAM', 'VELO', 'TROTTINETTE', 'AUTRE'] as const;
export const schemaTypeMobilite = z.enum(TYPES_MOBILITE);
export type TypeMobilite = z.infer<typeof schemaTypeMobilite>;

/** Résultat d'une exécution ETL ; `IGNORE` = fichier inchangé depuis le dernier chargement. */
export const STATUTS_EXECUTION = ['EN_COURS', 'SUCCES', 'ECHEC', 'IGNORE'] as const;
export const schemaStatutExecution = z.enum(STATUTS_EXECUTION);
export type StatutExecution = z.infer<typeof schemaStatutExecution>;
