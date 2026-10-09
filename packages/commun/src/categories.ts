// Vocabulaire métier partagé par l'application et le traitement des données (voir docs/GLOSSAIRE.md).
import { z } from 'zod';

export const CATEGORIES = ['enfants', 'nature', 'parcs', 'patrimoine', 'culture'] as const;
export const schemaCategorie = z.enum(CATEGORIES);
export type Categorie = z.infer<typeof schemaCategorie>;

export const TYPES_TRAIN = ['TER', 'INTERCITES', 'TGV', 'AUTRE'] as const;
export const schemaTypeTrain = z.enum(TYPES_TRAIN);
export type TypeTrain = z.infer<typeof schemaTypeTrain>;
