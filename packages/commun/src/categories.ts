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
export const TYPES_MOBILITE = [
  'BUS',
  'TRAM',
  'CAR',
  'VELO',
  'TROTTINETTE',
  'AUTRE',
  /** Parking vélo OpenStreetMap près d'une gare de la région : preuve qu'on peut y laisser son vélo (D097). */
  'PARKING_VELO',
] as const;
export const schemaTypeMobilite = z.enum(TYPES_MOBILITE);

/**
 * D'où vient la photo d'un lieu (D100), dans l'ordre de priorité : fichier Commons du tag OSM, image libre
 * de l'article Wikipédia, image de la fiche Wikidata, puis photo DATAtourisme.
 */
export const ORIGINES_PHOTO = ['osm', 'wikipedia', 'wikidata', 'datatourisme'] as const;
export type OriginePhoto = (typeof ORIGINES_PHOTO)[number];

/**
 * D'où vient une description ajoutée à un lieu (D123) : l'introduction de son article Wikipédia, ou nos
 * propres textes (`wagoo`, préparé, pas encore rempli). Ajouter une origine = étendre cette liste et la
 * contrainte de `description_lieu` (une migration d'une ligne), sans nouvelle colonne.
 */
export const ORIGINES_DESCRIPTION = ['wikipedia', 'wagoo'] as const;
export type OrigineDescription = (typeof ORIGINES_DESCRIPTION)[number];
export type TypeMobilite = z.infer<typeof schemaTypeMobilite>;

/** Résultat d'une exécution ETL ; `IGNORE` = fichier inchangé depuis le dernier chargement. */
export const STATUTS_EXECUTION = ['EN_COURS', 'SUCCES', 'ECHEC', 'IGNORE'] as const;
export const schemaStatutExecution = z.enum(STATUTS_EXECUTION);
export type StatutExecution = z.infer<typeof schemaStatutExecution>;
