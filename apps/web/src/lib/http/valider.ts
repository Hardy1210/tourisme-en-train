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
