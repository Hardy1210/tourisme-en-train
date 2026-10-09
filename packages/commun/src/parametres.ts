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
    dedoublonnage: z.strictObject({
      distanceM: schemaDistanceM,
      similariteNom: z.number().min(0).max(1),
      prioriteSources: z.array(z.string().min(1)).min(1),
    }),
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
        parKm: z.strictObject({ TER: schemaPrixKm, INTERCITES: schemaPrixKm, TGV: schemaPrixKm }),
        margeFourchette: z.number().min(0).max(1),
      })
      .refine(
        (prix) =>
          prix.aCalibrer ||
          (prix.source !== null && Object.values(prix.parKm).every((v) => v !== null)),
        {
          message:
            'Prix calibré (aCalibrer = false) : la source et tous les prix au km sont obligatoires.',
        },
      ),
  })
  .refine((p) => p.rayons.autourDeMoiOptionsM.includes(p.rayons.autourDeMoiDefautM), {
    message: 'Le rayon « autour de moi » par défaut doit faire partie des options.',
    path: ['rayons', 'autourDeMoiDefautM'],
  });

export type Parametres = z.infer<typeof schemaParametres>;

/** Paramètres validés au chargement : un fichier invalide arrête l'application ou le traitement. */
export const parametres: Parametres = schemaParametres.parse(parametresBruts);
