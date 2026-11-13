// OpenStreetMap par Overpass (docs/02-sources-donnees.md § 2.4, D041) : requête construite à partir
// des règles OSM de `categories.csv`, puis lecture des éléments. Fonctions pures.
import { z } from 'zod';
import {
  classer,
  etiquettesNonClassees,
  type Etiquette,
  type IndexRegles,
  type RegleCategorie,
} from './categories';
import type { Inclusion } from './corrections';
import type { ResultatLigne } from './datatourisme';
import { nettoyerDescription, normaliserNom, texteOuNull, urlValide } from './lieux';

export const schemaElementOsm = z.object({
  type: z.enum(['node', 'way', 'relation']),
  id: z.number().int(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  /** Centre d'une surface ou d'une relation (`out center`). */
  center: z.object({ lat: z.number(), lon: z.number() }).optional(),
  /** Tracé d'une ligne (`out geom`), demandé pour les lieux en longueur seulement (D043). */
  geometry: z.array(z.object({ lat: z.number(), lon: z.number() })).optional(),
  tags: z.record(z.string(), z.string()).default({}),
});
export type ElementOsm = z.infer<typeof schemaElementOsm>;

export const schemaReponseOverpass = z.object({
  elements: z.array(z.unknown()),
  /** Présent quand le serveur a interrompu la requête (délai, mémoire) : la réponse est incomplète. */
  remark: z.string().optional(),
});

const guillemets = (texte: string): string =>
  `"${texte.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;

/** Filtre Overpass d'une règle qui classe : `["leisure"="park"]["name"]`, `["historic"]["name"]`… */
function filtreDe(regle: RegleCategorie): string {
  const tag =
    regle.valeur === '*'
      ? `[${guillemets(regle.cle)}]`
      : `[${guillemets(regle.cle)}=${guillemets(regle.valeur)}]`;
  return regle.condition === 'sans_nom' ? tag : `${tag}["name"]`;
}

/** Règle d'un lieu en longueur (`lieux.enLongueurOsm`, ex. `waterway=canal`) : tracé demandé. */
const estEnLongueur = (regle: RegleCategorie, enLongueur: readonly string[]): boolean =>
  enLongueur.includes(`${regle.cle}=${regle.valeur}`);

/**
 * Requêtes Overpass, **une par règle qui classe** (catégorie non nulle), limitées à la région
 * (`ref:INSEE` de la région, parametres.json). Petites requêtes plutôt qu'une seule : chacune a son
 * propre délai côté serveur, et un échec ne fait refaire qu'elle. Une règle `clé=valeur` couverte
 * par la règle `clé=*` de même condition de nom est sautée (mêmes éléments, déjà demandés).
 * Lieu en longueur (`enLongueur`, D043) : lignes seulement (`way`), avec leur tracé (`out geom`).
 */
export function requetesOverpass(
  regles: readonly RegleCategorie[],
  codeInseeRegion: string,
  delaiS: number,
  enLongueur: readonly string[] = [],
): { filtre: string; requete: string }[] {
  const classantes = regles.filter((r) => r.categorie !== null);
  const filtres = new Set<string>();
  for (const regle of classantes) {
    if (estEnLongueur(regle, enLongueur)) {
      filtres.add(`way${filtreDe(regle)}`);
      continue;
    }
    const couverte =
      regle.valeur !== '*' &&
      classantes.some(
        (r) =>
          r.cle === regle.cle &&
          r.valeur === '*' &&
          (r.condition === 'sans_nom') === (regle.condition === 'sans_nom'),
      );
    if (!couverte) filtres.add(filtreDe(regle));
  }
  const aire = `area["boundary"="administrative"]["admin_level"="4"]["ref:INSEE"=${guillemets(codeInseeRegion)}]->.region;`;
  return [...filtres].sort().map((filtre) => ({
    filtre,
    requete: [
      `[out:json][timeout:${delaiS}];`,
      aire,
      filtre.startsWith('way') ? `${filtre}(area.region);` : `nwr${filtre}(area.region);`,
      filtre.startsWith('way') ? 'out geom tags;' : 'out center tags;',
    ].join('\n'),
  }));
}

/** Signe de sortie (règles `notable`) : lien encyclopédique, Monument historique, tourisme, loisirs, baignade. */
export function estNotable(tags: Readonly<Record<string, string>>): boolean {
  return (
    ['wikipedia', 'wikidata', 'ref:mhs', 'tourism', 'leisure'].some((cle) => cle in tags) ||
    tags.sport === 'swimming'
  );
}

/** Photo : tag `image` s'il est une adresse web, sinon le fichier `wikimedia_commons` (« File:… »). */
export function imageDe(tags: Readonly<Record<string, string>>): string | null {
  const image = urlValide(tags.image);
  if (image) return image;
  const fichier = /^File:(.+)$/.exec(tags.wikimedia_commons ?? '')?.[1];
  return fichier
    ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fichier.trim())}`
    : null;
}

function adresseDe(tags: Readonly<Record<string, string>>): string | null {
  const rue = texteOuNull([tags['addr:housenumber'], tags['addr:street']].join(' '));
  const ville = texteOuNull([tags['addr:postcode'], tags['addr:city']].join(' '));
  return texteOuNull([rue, ville].filter(Boolean).join(', '));
}

/** Tracé GeoJSON (LineString) d'une ligne lue avec `out geom` ; null pour un point ou une surface. */
export function traceDe(element: ElementOsm): string | null {
  const points = element.geometry ?? [];
  if (element.type !== 'way' || points.length < 2) return null;
  return JSON.stringify({ type: 'LineString', coordinates: points.map((p) => [p.lon, p.lat]) });
}

const majuscule = (texte: string): string => texte.charAt(0).toUpperCase() + texte.slice(1);

export function lireElementOsm(
  element: ElementOsm,
  index: IndexRegles,
  descriptionMax: number,
  inclusion: Inclusion = () => undefined,
): ResultatLigne {
  const { tags } = element;
  const etiquettes: Etiquette[] = Object.entries(tags);
  const nonClassees = etiquettesNonClassees(index, etiquettes);
  const nom = normaliserNom(tags.name ?? '');
  // « inclure » (corrections manuelles) passe avant les règles de catégorie (D091).
  const impose = inclusion(`${element.type}/${element.id}`);
  const classement = impose
    ? ({ type: 'classe', ...impose } as const)
    : classer(index, etiquettes, { aNom: nom !== '', notable: estNotable(tags) });
  if (classement.type !== 'classe') return { type: 'ecarte', raison: classement.type, nonClassees };

  const trace = traceDe(element);
  const milieu = element.geometry?.[Math.floor((element.geometry.length - 1) / 2)];
  const lat = element.lat ?? element.center?.lat ?? milieu?.lat;
  const lon = element.lon ?? element.center?.lon ?? milieu?.lon;
  if (lat === undefined || lon === undefined) {
    return { type: 'ecarte', raison: 'sans_position', nonClassees };
  }

  return {
    type: 'lieu',
    nonClassees,
    etiquettes,
    lieu: {
      idSource: `${element.type}/${element.id}`,
      // Sans nom (règle `sans_nom`, aires de jeux) : le libellé de la sous-catégorie.
      nom: nom || majuscule(classement.sousCategorie ?? classement.categorie),
      categorie: classement.categorie,
      sousCategorie: classement.sousCategorie,
      description: nettoyerDescription(tags.description, descriptionMax),
      adresse: adresseDe(tags),
      url: urlValide(tags.website ?? tags['contact:website'] ?? tags.url),
      imageUrl: imageDe(tags),
      horaires: texteOuNull(tags.opening_hours),
      qualiteTourisme: false,
      lon,
      lat,
      trace,
    },
  };
}
