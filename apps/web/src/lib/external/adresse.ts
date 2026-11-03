// Adaptateur de l'API Adresse de la Géoplateforme (docs/02-sources-donnees.md § 3.1, D022, D051).
// Seul module qui l'appelle : si l'API change, on ne touche qu'ici (CLAUDE.md § 2, règle 9).
// Aucune position ni texte recherché n'est journalisé ; toute panne devient `ServiceExterneIndisponible`.
import 'server-only';
import { trouverSource } from '@tourisme/commun';
import { z } from 'zod';

import { ServiceExterneIndisponible } from '@/lib/http/erreurs';

/** Délai d'attente technique : au-delà, l'application passe au repli hors ligne. */
const DELAI_MS = 3000;

const schemaReponse = z.object({
  features: z.array(
    z.object({
      geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
      properties: z.object({
        label: z.string(),
        type: z.string(),
        city: z.string().optional(),
        citycode: z.string().optional(),
      }),
    }),
  ),
});

export type AdresseTrouvee = {
  libelle: string;
  commune: string;
  codeInsee: string | null;
  lat: number;
  lon: number;
  type: 'commune' | 'adresse';
};

function adresseApi(): string {
  const api = trouverSource('api_adresse').api;
  if (!api) throw new ServiceExterneIndisponible('La recherche d’adresse n’est pas configurée.');
  return api;
}

async function appeler(
  chemin: string,
  parametres: Record<string, string>,
): Promise<AdresseTrouvee[]> {
  const url = new URL(`${adresseApi()}/${chemin}`);
  for (const [cle, valeur] of Object.entries(parametres)) url.searchParams.set(cle, valeur);
  let corps: unknown;
  try {
    const reponse = await fetch(url, { signal: AbortSignal.timeout(DELAI_MS) });
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
    corps = await reponse.json();
  } catch {
    throw new ServiceExterneIndisponible('La recherche d’adresse est indisponible.');
  }
  const lu = schemaReponse.safeParse(corps);
  if (!lu.success) throw new ServiceExterneIndisponible('La recherche d’adresse est indisponible.');
  return lu.data.features.map(({ geometry, properties }) => ({
    libelle: properties.label,
    commune: properties.city ?? properties.label,
    codeInsee: properties.citycode ?? null,
    lon: geometry.coordinates[0],
    lat: geometry.coordinates[1],
    type: properties.type === 'municipality' ? 'commune' : 'adresse',
  }));
}

/** Recherche par texte (saisie semi-automatique). */
export function rechercherAdresses(texte: string, limite: number): Promise<AdresseTrouvee[]> {
  return appeler('search', { q: texte, limit: String(limite), autocomplete: '1' });
}

/**
 * Commune d'une position : adresse la plus proche, **sans** filtre de type (`municipality` ne renvoie
 * rien, audit E09). null si l'API ne trouve rien.
 */
export async function communeAuPoint(
  lat: number,
  lon: number,
): Promise<{ commune: string; codeInsee: string | null } | null> {
  const [plusProche] = await appeler('reverse', { lat: String(lat), lon: String(lon), limit: '1' });
  return plusProche ? { commune: plusProche.commune, codeInsee: plusProche.codeInsee } : null;
}
