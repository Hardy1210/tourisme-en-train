// LE SEUL schéma de config/parametres.json (docs/04-traitement-donnees.md § 2).
// Importé par l'application et par le traitement des données : aucune autre copie n'existe.
import { z } from 'zod';
import parametresBruts from '../../../config/parametres.json' with { type: 'json' };

const schemaHeure = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure attendue au format HH:MM');
const schemaDistanceM = z.number().int().positive();
const schemaMode = z.strictObject({
  vitesseKmH: z.number().positive(),
  coefDetour: z.number().min(1),
});

// Facteur CO₂ à null = pas encore relevé : toujours accepté (D031).
const schemaFacteurCo2 = z.number().positive().nullable();
// Prix au km à null : accepté seulement tant que prix.aCalibrer est vrai (règle plus bas).
const schemaPrixKm = z.number().positive().nullable();

export const schemaParametres = z
  .strictObject({
    version: z.literal(1),
    fuseau: z.literal('Europe/Paris'),
    region: z.strictObject({
      codeInsee: z.string().regex(/^\d{2}$/),
      nom: z.string().min(1),
      departements: z.array(z.string().regex(/^(\d{2,3}|2A|2B)$/)).min(1),
      /** Rectangle qui contient la région : contrôle « aucune gare de la région hors de son emprise ». */
      emprise: z.strictObject({
        latMin: z.number().min(-90).max(90),
        latMax: z.number().min(-90).max(90),
        lonMin: z.number().min(-180).max(180),
        lonMax: z.number().min(-180).max(180),
      }),
    }),
    /** Seuils des contrôles bloquants de l'ETL (docs/04-traitement-donnees.md § 4). */
    controles: z.strictObject({
      /** Codes INSEE dans `commune` (communes, arrondissements, communes déléguées, D038). */
      communesFranceMin: z.number().int().positive(),
      garesFranceMin: z.number().int().positive(),
      garesRegionMin: z.number().int().positive(),
      /** Part minimale (en %) des passages des trajets retenus rapprochés d'une gare (E03). */
      rapprochementGtfsMinPct: z.number().min(0).max(100),
      /** Communes de la région avec un contour (source `contours`, D041). */
      contoursRegionMin: z.number().int().positive(),
      /** Lieux gardés dans la région, par source de lieux (E05). */
      lieuxSourceMin: z.number().int().positive(),
    }),
    fenetreJoursHoraires: z.number().int().positive(),
    fenetreJoursLiaisons: z.number().int().positive(),
    marche: schemaMode,
    velo: schemaMode,
    voiture: schemaMode,
    rail: z.strictObject({ coefDetour: z.number().min(1) }),
    rayons: z.strictObject({
      lieuxGareM: schemaDistanceM,
      autourDeMoiDefautM: schemaDistanceM,
      autourDeMoiOptionsM: z.array(schemaDistanceM).min(1),
      mobiliteM: schemaDistanceM,
      cyclableM: schemaDistanceM,
    }),
    durees: z.strictObject({
      trainMaxOptionsMin: z.array(z.number().int().positive()).min(1),
      tranchesTempsMin: z.array(z.number().int().positive()).min(1),
    }),
    journee: z.strictObject({
      arriveeMaxAller: schemaHeure,
      dureeVisiteMin: z.number().int().positive(),
    }),
    lieux: z.strictObject({
      /** Description coupée au mot près au-delà de cette longueur (docs/04 § 4.4). */
      descriptionMaxCaracteres: z.number().int().positive(),
      /** Tags OSM `clé=valeur` des lieux en longueur (canal) : tracé gardé, pas seulement un point (D043). */
      enLongueurOsm: z.array(z.string().regex(/^[^=\s]+=[^=\s]+$/, 'clé=valeur attendu')),
      /** Tronçons de même nom à moins de cette distance : un seul lieu en longueur (D043). */
      raccordTronconsM: schemaDistanceM,
    }),
    /** Doublons entre sources, en deux paliers (docs/04 § 4.6, D043). Noms comparés sans accents. */
    dedoublonnage: z.strictObject({
      distanceM: schemaDistanceM,
      similariteNom: z.number().min(0).max(1),
      /** Palier large (grands lieux dont le point diffère selon la source) : nom presque identique et même catégorie. */
      distanceLargeM: schemaDistanceM,
      similariteNomLarge: z.number().min(0).max(1),
      /** Paires du palier proche entre ce seuil et `similariteNom` : rapport à relire, pas de fusion. */
      similariteARelire: z.number().min(0).max(1),
      prioriteSources: z.array(z.string().min(1)).min(1),
    }),
    /** Sous-catégories regroupées en un site, avec leur distance (D043). Jamais tout le patrimoine. */
    regroupementSites: z
      .array(z.strictObject({ sousCategorie: z.string().min(1), distanceM: schemaDistanceM }))
      .refine((l) => new Set(l.map((r) => r.sousCategorie)).size === l.length, {
        message: 'Sous-catégorie en double dans regroupementSites',
      }),
    /** « Parc / jardin… du <nom complet du château> » à moins de cette distance : partie du site du château (D045). */
    regroupementParcChateau: z.strictObject({ distanceM: schemaDistanceM }),
    /** Arrêts de même nom d'un réseau à moins de cette distance (quais opposés) : un seul arrêt (D046). */
    mobilite: z.strictObject({ regroupementQuaisM: schemaDistanceM }),
    limites: z.strictObject({
      gares: z.number().int().positive(),
      lieux: z.number().int().positive(),
      destinations: z.number().int().positive(),
      trains: z.number().int().positive(),
      mobilites: z.number().int().positive(),
    }),
    impact: z.strictObject({
      source: z.string().min(1),
      dateReleve: z.iso.date(),
      facteursCo2GParKm: z.strictObject({
        TGV: schemaFacteurCo2,
        TER: schemaFacteurCo2,
        INTERCITES: schemaFacteurCo2,
        VOITURE: z.number().positive(),
        AVION: schemaFacteurCo2,
      }),
      occupantsVoiturePartagee: z.number().int().min(2),
      distanceMinAvionKm: z.number().positive(),
    }),
    prix: z
      .strictObject({
        aCalibrer: z.boolean(),
        source: z.string().min(1).nullable(),
        /** Date du calibrage des prix au km (D048). */
        dateCalibrage: z.iso.date().nullable(),
        parKm: z.strictObject({ TER: schemaPrixKm, INTERCITES: schemaPrixKm, TGV: schemaPrixKm }),
        margeFourchette: z.number().min(0).max(1),
      })
      .refine(
        (prix) =>
          prix.aCalibrer ||
          (prix.source !== null &&
            prix.dateCalibrage !== null &&
            Object.values(prix.parKm).every((v) => v !== null)),
        {
          message:
            'Prix calibré (aCalibrer = false) : la source, la date du calibrage et tous les prix au km sont obligatoires.',
        },
      ),
  })
  .refine((p) => p.dedoublonnage.distanceLargeM > p.dedoublonnage.distanceM, {
    message: 'Le palier large du dédoublonnage doit dépasser le palier proche.',
    path: ['dedoublonnage', 'distanceLargeM'],
  })
  .refine((p) => p.dedoublonnage.similariteARelire < p.dedoublonnage.similariteNom, {
    message: 'Le seuil « à relire » doit être sous la similarité de fusion.',
    path: ['dedoublonnage', 'similariteARelire'],
  })
  .refine((p) => p.rayons.autourDeMoiOptionsM.includes(p.rayons.autourDeMoiDefautM), {
    message: 'Le rayon « autour de moi » par défaut doit faire partie des options.',
    path: ['rayons', 'autourDeMoiDefautM'],
  });

export type Parametres = z.infer<typeof schemaParametres>;

/** Paramètres validés au chargement : un fichier invalide arrête l'application ou le traitement. */
export const parametres: Parametres = schemaParametres.parse(parametresBruts);
