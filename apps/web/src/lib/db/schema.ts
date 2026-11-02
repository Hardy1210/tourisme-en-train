// Schéma de la base, tables P0 (docs/03-base-de-donnees.md § 3, document de référence).
// Tables P1 en E07.
// Sans `import 'server-only'` : lu aussi par drizzle-kit, hors de Next.js (D031).
// Noms de colonnes : camelCase ici, snake_case en base (option `casing` de Drizzle).
import {
  CATEGORIES,
  CONDITIONS_REGLE,
  STATUTS_EXECUTION,
  TYPES_MOBILITE,
  TYPES_TRAIN,
} from '@tourisme/commun';
import { sql, type SQL } from 'drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
  boolean,
  char,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

import { geographyMultiLigne, geographyMultiPolygone, geographyPoint } from './types-postgis';

/** `colonne IN ('A', 'B')` à partir d'une liste partagée de @tourisme/commun (jamais recopiée). */
function parmi(colonne: AnyPgColumn, valeurs: readonly string[]): SQL {
  const liste = valeurs.map((valeur) => `'${valeur.replaceAll("'", "''")}'`).join(', ');
  return sql`${colonne} IN (${sql.raw(liste)})`;
}

const maj = () => timestamp({ withTimezone: true }).notNull().defaultNow();

// § 3.11
export const sourceDonnees = pgTable('source_donnees', {
  code: text().primaryKey(),
  nom: text().notNull(),
  producteur: text().notNull(),
  url: text().notNull(),
  licence: text().notNull(),
  attribution: text().notNull(),
  dateTelechargement: timestamp({ withTimezone: true }),
  empreinte: text(),
  nbLignes: integer(),
});

// § 3.1 bis
export const commune = pgTable(
  'commune',
  {
    codeInsee: char({ length: 5 }).primaryKey(),
    nom: text().notNull(),
    departement: char({ length: 3 }).notNull(),
    // Communes de la région seulement (source `contours`, D041) ; nul ailleurs.
    contour: geographyMultiPolygone(),
  },
  (t) => [index().using('gist', t.contour)],
);

// § 3.1
export const gare = pgTable(
  'gare',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uic: char({ length: 8 }).notNull().unique(),
    codesUic: char({ length: 8 }).array().notNull(),
    nom: text().notNull(),
    codeInsee: char({ length: 5 }).references(() => commune.codeInsee),
    dansRegion: boolean().notNull().default(false),
    geom: geographyPoint().notNull(),
    maj: maj(),
  },
  (t) => [
    index().using('gist', t.geom),
    index().on(t.dansRegion),
    index().using('gin', t.codesUic),
    index().on(t.codeInsee),
    check('gare_uic_dans_codes_uic_check', sql`${t.uic} = ANY (${t.codesUic})`),
  ],
);

// § 3.2
export const trajet = pgTable(
  'trajet',
  {
    id: text().primaryKey(),
    serviceId: text().notNull(),
    typeTrain: text().notNull(),
    nomLigne: text(),
    numero: text(),
  },
  (t) => [
    index().on(t.serviceId),
    check('trajet_type_train_check', parmi(t.typeTrain, TYPES_TRAIN)),
  ],
);

// § 3.3
export const passage = pgTable(
  'passage',
  {
    trajetId: text()
      .notNull()
      .references(() => trajet.id, { onDelete: 'cascade' }),
    sequence: smallint().notNull(),
    gareId: integer()
      .notNull()
      .references(() => gare.id),
    arriveeS: integer(),
    departS: integer(),
    // D036 : `pickup_type` / `drop_off_type` = 1 dans le GTFS.
    monteeInterdite: boolean().notNull().default(false),
    descenteInterdite: boolean().notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.trajetId, t.sequence] }), index().on(t.gareId)],
);

// § 3.4
export const serviceJour = pgTable(
  'service_jour',
  {
    serviceId: text().notNull(),
    dateService: date({ mode: 'string' }).notNull(), // AAAA-MM-JJ, jamais un Date (CLAUDE.md § 3)
  },
  (t) => [primaryKey({ columns: [t.serviceId, t.dateService] }), index().on(t.dateService)],
);

// § 3.5 — deux sens (départ OU arrivée dans la région), trains en jumelage comptés une fois (D040).
// Le dernier retour est le `dernierDepartS` de la liaison inverse (même date), lu par jointure.
export const liaisonDirecte = pgTable(
  'liaison_directe',
  {
    gareDepartId: integer()
      .notNull()
      .references(() => gare.id),
    gareArriveeId: integer()
      .notNull()
      .references(() => gare.id),
    dateService: date({ mode: 'string' }).notNull(),
    dureeMin: smallint().notNull(),
    nbTrains: smallint().notNull(),
    premierDepartS: integer().notNull(),
    dernierDepartS: integer().notNull(),
    premiereArriveeS: integer().notNull(),
    typesTrain: text().array().notNull(),
    distanceKm: numeric({ precision: 6, scale: 1, mode: 'number' }).notNull(),
    faisableJournee: boolean().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.gareDepartId, t.gareArriveeId, t.dateService] }),
    // Liaisons vers une gare : protection des gares au chargement, clé étrangère à la suppression.
    index().on(t.gareArriveeId),
    check('liaison_directe_gares_distinctes_check', sql`${t.gareDepartId} <> ${t.gareArriveeId}`),
    check('liaison_directe_duree_min_check', sql`${t.dureeMin} > 0`),
    check('liaison_directe_nb_trains_check', sql`${t.nbTrains} > 0`),
  ],
);

// § 3.6
export const lieu = pgTable(
  'lieu',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    source: text()
      .notNull()
      .references(() => sourceDonnees.code),
    idSource: text().notNull(),
    nom: text().notNull(),
    categorie: text().notNull(),
    sousCategorie: text(),
    description: text(),
    adresse: text(),
    // Commune dont le contour contient le lieu (D041).
    codeInsee: char({ length: 5 }).references(() => commune.codeInsee),
    url: text(),
    imageUrl: text(),
    horaires: text(),
    periode: text(),
    qualiteTourisme: boolean().notNull().default(false),
    // Un lieu supprimé au rechargement de sa source ne bloque pas ses doublons (recalculés en E06).
    doublonDe: bigint({ mode: 'number' }).references((): AnyPgColumn => lieu.id, {
      onDelete: 'set null',
    }),
    // Représentant du site dont ce lieu fait partie (29 grottes d'Arcy-sur-Cure → 1 site), recalculé
    // par `pnpm etl rattachements` (D043).
    siteDe: bigint({ mode: 'number' }).references((): AnyPgColumn => lieu.id, {
      onDelete: 'set null',
    }),
    geom: geographyPoint().notNull(),
    // Tracé d'un lieu en longueur (canal) : rattaché aux gares proches de son tracé (D043).
    trace: geographyMultiLigne(),
    maj: maj(),
  },
  (t) => [
    unique('lieu_source_id_source_unique').on(t.source, t.idSource),
    index().using('gist', t.geom),
    index().on(t.categorie),
    index('lieu_nom_trgm_index').using('gin', t.nom.op('gin_trgm_ops')),
    check('lieu_categorie_check', parmi(t.categorie, CATEGORIES)),
  ],
);

// § 3.7 — `categorie` nulle = valeur à exclure.
export const categorieRegle = pgTable(
  'categorie_regle',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    source: text().notNull(),
    cle: text().notNull(),
    valeur: text().notNull(),
    categorie: text(),
    sousCategorie: text(),
    priorite: smallint().notNull().default(100),
    /** OSM : nul = nom obligatoire ; voir CONDITIONS_REGLE (D041). */
    condition: text(),
  },
  (t) => [
    unique().on(t.source, t.cle, t.valeur),
    check('categorie_regle_categorie_check', parmi(t.categorie, CATEGORIES)),
    check('categorie_regle_condition_check', parmi(t.condition, CONDITIONS_REGLE)),
  ],
);

// § 3.8
export const lieuGare = pgTable(
  'lieu_gare',
  {
    lieuId: bigint({ mode: 'number' })
      .notNull()
      .references(() => lieu.id, { onDelete: 'cascade' }),
    gareId: integer()
      .notNull()
      .references(() => gare.id),
    distanceM: integer().notNull(),
    dureeMarcheMin: smallint().notNull(),
  },
  (t) => [primaryKey({ columns: [t.lieuId, t.gareId] }), index().on(t.gareId, t.distanceM)],
);

// § 3.9
export const gareStats = pgTable(
  'gare_stats',
  {
    gareId: integer()
      .notNull()
      .references(() => gare.id),
    categorie: text().notNull(),
    nbLieux: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.gareId, t.categorie] })],
);

// § 3.10
export const mobiliteLocale = pgTable(
  'mobilite_locale',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    gareId: integer()
      .notNull()
      .references(() => gare.id),
    type: text().notNull(),
    nom: text().notNull(),
    lignes: text().array(),
    operateur: text(),
    source: text()
      .notNull()
      .references(() => sourceDonnees.code),
    idSource: text(),
    distanceM: integer().notNull(),
    geom: geographyPoint().notNull(),
  },
  (t) => [
    index().on(t.gareId, t.distanceM),
    check('mobilite_locale_type_check', parmi(t.type, TYPES_MOBILITE)),
  ],
);

// § 3.12
export const executionEtl = pgTable(
  'execution_etl',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    source: text().notNull(),
    debut: timestamp({ withTimezone: true }).notNull(),
    fin: timestamp({ withTimezone: true }),
    statut: text().notNull(),
    nbLignes: integer(),
    message: text(),
  },
  (t) => [check('execution_etl_statut_check', parmi(t.statut, STATUTS_EXECUTION))],
);
