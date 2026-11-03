// Lecture et validation Zod des paramètres de requête (docs/05-api.md § 1.3, 1.6, 1.7, 1.9).
// Les schémas des routes vivent dans `features/*/schemas.ts` ; ici, seulement les briques communes.
import { CATEGORIES, schemaCategorie } from '@tourisme/commun';
import { z } from 'zod';

import { parametres } from '@/config/parametres';

import { ParametreInvalide } from './erreurs';

const { latMin, latMax, lonMin, lonMax } = parametres.empriseFrance;
const MESSAGE_POSITION = 'La position doit se trouver en France métropolitaine.';

export const schemaLat = z.coerce
  .number({ error: 'La latitude doit être un nombre.' })
  .min(latMin, MESSAGE_POSITION)
  .max(latMax, MESSAGE_POSITION);

export const schemaLon = z.coerce
  .number({ error: 'La longitude doit être un nombre.' })
  .min(lonMin, MESSAGE_POSITION)
  .max(lonMax, MESSAGE_POSITION);

/** `categories=enfants,parcs` ; absent = toutes ; `null` en sortie = aucun filtre demandé. */
export const schemaCategories = z
  .string()
  .optional()
  .transform((texte) => (texte ? [...new Set(texte.split(',').map((c) => c.trim()))] : null))
  .pipe(
    z
      .array(schemaCategorie, {
        error: `Catégories possibles : ${CATEGORIES.join(', ')}.`,
      })
      .min(1, `Catégories possibles : ${CATEGORIES.join(', ')}.`)
      .nullable(),
  );

/** `date=AAAA-MM-JJ` ; la fenêtre des données est vérifiée par le service (elle vient de la base). */
export const schemaDate = z.iso
  .date({ error: 'La date doit être au format AAAA-MM-JJ.' })
  .optional();

/** Identifiant entier positif (gare, lieu). */
export const schemaId = (quoi: string) =>
  z.coerce
    .number({ error: `L'identifiant de ${quoi} doit être un nombre entier.` })
    .int(`L'identifiant de ${quoi} doit être un nombre entier.`)
    .positive(`L'identifiant de ${quoi} doit être un nombre entier.`);

/** Valeur choisie parmi une liste de `parametres.json` (rayons, durées). */
export const schemaParmi = (valeurs: readonly number[], quoi: string) =>
  z.coerce
    .number()
    .refine((v) => valeurs.includes(v), `${quoi} possibles : ${valeurs.join(', ')}.`);

/** Valide un segment dynamique de l'URL (`[uic]`, `[cle]`) ; invalide → `400` au message clair. */
export function validerSegment<S extends z.ZodType>(valeur: string, schema: S): z.output<S> {
  const resultat = schema.safeParse(decodeURIComponent(valeur));
  if (resultat.success) return resultat.data;
  throw new ParametreInvalide(resultat.error.issues[0]?.message ?? 'Adresse invalide.');
}

/** Valide les paramètres de l'URL ; le premier problème devient un `400` au message clair. */
export function lireParametres<S extends z.ZodType>(requete: Request, schema: S): z.output<S> {
  const brut = Object.fromEntries(new URL(requete.url).searchParams);
  const resultat = schema.safeParse(brut);
  if (resultat.success) return resultat.data;
  const [probleme] = resultat.error.issues;
  const champ = probleme?.path.join('.') ?? '';
  const message =
    champ !== '' && !(champ in brut)
      ? `Le paramètre « ${champ} » est obligatoire.`
      : (probleme?.message ?? 'Paramètres invalides.');
  throw new ParametreInvalide(message);
}

/** Code UIC d'une gare (identifiant public stable, D052) : 8 caractères (chiffres en production). */
export const schemaUic = z
  .string({ error: 'Le code UIC de la gare est obligatoire.' })
  .regex(/^[0-9A-Z]{8}$/, 'Le code UIC de la gare doit compter 8 chiffres.');

/** Clé publique d'un lieu (D052) : `<source>-<identifiant>`, ex. `osm-way-123456`. */
export const schemaCleLieu = z
  .string()
  .regex(/^[a-z][a-z0-9_]*-[A-Za-z0-9_-]{1,80}$/, 'Cette clé de lieu est invalide.');
