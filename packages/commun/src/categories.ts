// Vocabulaire métier partagé par l'application et le traitement des données (voir docs/GLOSSAIRE.md).
import { z } from 'zod';

export const CATEGORIES = ['enfants', 'nature', 'parcs', 'patrimoine', 'culture'] as const;
export const schemaCategorie = z.enum(CATEGORIES);
export type Categorie = z.infer<typeof schemaCategorie>;

/**
 * Condition d'une règle de catégorie OSM (`regles/categories.csv`, D041). Aucune = nom obligatoire ;
 * `sans_nom` = gardé même sans nom ; `notable` = nommé et avec un signe de sortie.
 */
export const CONDITIONS_REGLE = ['sans_nom', 'notable'] as const;
export const schemaConditionRegle = z.enum(CONDITIONS_REGLE);
export type ConditionRegle = z.infer<typeof schemaConditionRegle>;

export const TYPES_TRAIN = ['TER', 'INTERCITES', 'TGV', 'AUTRE'] as const;
export const schemaTypeTrain = z.enum(TYPES_TRAIN);
export type TypeTrain = z.infer<typeof schemaTypeTrain>;

/** `CAR` : cars régionaux (Mobigo), pour se déplacer sur place (D046). */
export const TYPES_MOBILITE = ['BUS', 'TRAM', 'CAR', 'VELO', 'TROTTINETTE', 'AUTRE'] as const;
export const schemaTypeMobilite = z.enum(TYPES_MOBILITE);
export type TypeMobilite = z.infer<typeof schemaTypeMobilite>;

/** Résultat d'une exécution ETL ; `IGNORE` = fichier inchangé depuis le dernier chargement. */
export const STATUTS_EXECUTION = ['EN_COURS', 'SUCCES', 'ECHEC', 'IGNORE'] as const;
export const schemaStatutExecution = z.enum(STATUTS_EXECUTION);
export type StatutExecution = z.infer<typeof schemaStatutExecution>;
