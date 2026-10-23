// Schéma de la base, tables P0 (docs/03-base-de-donnees.md § 3, document de référence).
// `liaison_directe` (§ 3.5) est créée au début de E04 ; tables P1 en E07.
// Sans `import 'server-only'` : lu aussi par drizzle-kit, hors de Next.js (D031).
// Noms de colonnes : camelCase ici, snake_case en base (option `casing` de Drizzle).
import { CATEGORIES, STATUTS_EXECUTION, TYPES_MOBILITE, TYPES_TRAIN } from '@tourisme/commun';
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
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

import { geographyPoint } from './types-postgis';

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
export const commune = pgTable('commune', {
  codeInsee: char({ length: 5 }).primaryKey(),
  nom: text().notNull(),
  departement: char({ length: 3 }).notNull(),
});

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
    commune: text(),
    codeInsee: char({ length: 5 }),
    url: text(),
    imageUrl: text(),
    horaires: text(),
    periode: text(),
    qualiteTourisme: boolean().notNull().default(false),
    doublonDe: bigint({ mode: 'number' }).references((): AnyPgColumn => lieu.id),
    geom: geographyPoint().notNull(),
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
  },
  (t) => [
    unique().on(t.source, t.cle, t.valeur),
    check('categorie_regle_categorie_check', parmi(t.categorie, CATEGORIES)),
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
