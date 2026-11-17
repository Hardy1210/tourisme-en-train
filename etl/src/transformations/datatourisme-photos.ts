// Photos de nos fiches DATAtourisme dans l'export national RDF (N-Triples, ≈ 14 Go en clair) (D100, D101).
// Le fichier n'est jamais gardé en mémoire : trois passages sur le flux, chacun ne garde que les lignes
// des ressources trouvées au passage précédent (fiche → représentation → annotation et ressource).
import type { MediaDatatourisme } from './photos';

const CORE = 'https://www.datatourisme.fr/ontology/core#';
const EBU = 'http://www.ebu.ch/metadata/ontologies/ebucore/ebucore#';
const PRINCIPALE = `${CORE}hasMainRepresentation`;
const REPRESENTATION = `${CORE}hasRepresentation`;
const ANNOTATION = `${EBU}hasAnnotation`;
const RESSOURCE = `${EBU}hasRelatedResource`;
const CREDITS = `${CORE}credits`;
const DEBUT = `${CORE}rightsStartDate`;
const FIN = `${CORE}rightsEndDate`;
const ADRESSE = `${EBU}locator`;

interface Triplet {
  sujet: string;
  predicat: string;
  objet: string;
}

/** `<a> <b> objet .` → ses trois parties ; les adresses sans chevrons. Null pour une ligne vide ou un commentaire. */
export function lireTriplet(ligne: string): Triplet | null {
  const t = /^(\S+)\s+<([^>]+)>\s+(.+?)\s*\.\s*$/.exec(ligne);
  if (!t) return null;
  const [, sujet = '', predicat = '', objet = ''] = t;
  const sansChevrons = (x: string) => (x.startsWith('<') && x.endsWith('>') ? x.slice(1, -1) : x);
  return { sujet: sansChevrons(sujet), predicat, objet: sansChevrons(objet) };
}

const ECHAPPEMENTS: Readonly<Record<string, string>> = {
  t: '\t',
  b: '\b',
  n: '\n',
  r: '\r',
  f: '\f',
  '"': '"',
  "'": "'",
  '\\': '\\',
};

/** Texte d'un littéral N-Triples (`"Musée"@fr`, `"2024-12-31"^^<…#date>`) ; null si ce n'en est pas un. */
export function lireLitteral(objet: string): string | null {
  const contenu = /^"((?:[^"\\]|\\.)*)"/.exec(objet)?.[1];
  if (contenu === undefined) return null;
  return contenu.replace(/\\(u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|.)/g, (_tout, code: string) =>
    code.length > 1
      ? String.fromCodePoint(Number.parseInt(code.slice(1), 16))
      : (ECHAPPEMENTS[code] ?? code),
  );
}

type Lignes = () => AsyncIterable<string>;

/** Un passage : pour chaque sujet de `sujets`, ses (prédicat, objet) dont le prédicat est demandé. */
async function passage(
  ouvrir: Lignes,
  sujets: ReadonlySet<string>,
  predicats: ReadonlySet<string>,
): Promise<Map<string, Triplet[]>> {
  const trouves = new Map<string, Triplet[]>();
  for await (const ligne of ouvrir()) {
    // Filtre rapide avant toute expression régulière : la plupart des lignes ne nous concernent pas.
    const fin = ligne.indexOf(' ');
    if (fin < 0) continue;
    const brut = ligne.slice(0, fin);
    const sujet = brut.startsWith('<') ? brut.slice(1, -1) : brut;
    if (!sujets.has(sujet)) continue;
    const triplet = lireTriplet(ligne);
    if (!triplet || !predicats.has(triplet.predicat)) continue;
    const liste = trouves.get(sujet) ?? [];
    liste.push(triplet);
    trouves.set(sujet, liste);
  }
  return trouves;
}

/**
 * Fiche (adresse de la ressource, ex. `https://data.datatourisme.fr/6/…`) → ses photos, la principale
 * d'abord. Une photo sans adresse est ignorée ; sans crédit ou sans dates, elle est rendue telle quelle
 * (c'est la règle de choix qui l'écarte).
 */
export async function lireMediasDatatourisme(
  ouvrir: Lignes,
  fiches: ReadonlySet<string>,
): Promise<Map<string, MediaDatatourisme[]>> {
  const parFiche = await passage(ouvrir, fiches, new Set([PRINCIPALE, REPRESENTATION]));
  const representations = new Map<string, string[]>();
  for (const [fiche, triplets] of parFiche) {
    const principales = triplets.filter((t) => t.predicat === PRINCIPALE).map((t) => t.objet);
    const autres = triplets.filter((t) => t.predicat === REPRESENTATION).map((t) => t.objet);
    representations.set(fiche, [...new Set([...principales, ...autres])]);
  }
  const medias = new Map<string, MediaDatatourisme[]>();
  const toutes = new Set([...representations.values()].flat());
  if (toutes.size === 0) return medias;

  const liens = await passage(ouvrir, toutes, new Set([ANNOTATION, RESSOURCE]));
  const sousRessources = new Set([...liens.values()].flat().map((t) => t.objet));
  const valeurs = await passage(ouvrir, sousRessources, new Set([CREDITS, DEBUT, FIN, ADRESSE]));
  const valeur = (sujet: string | undefined, predicat: string): string | null => {
    const objet = valeurs.get(sujet ?? '')?.find((t) => t.predicat === predicat)?.objet;
    return objet === undefined ? null : lireLitteral(objet);
  };

  for (const [fiche, reps] of representations) {
    const liste: MediaDatatourisme[] = [];
    for (const rep of reps) {
      const lien = (p: string) => liens.get(rep)?.find((t) => t.predicat === p)?.objet;
      const url = valeur(lien(RESSOURCE), ADRESSE);
      if (!url) continue;
      const annotation = lien(ANNOTATION);
      const credits = valeur(annotation, CREDITS);
      liste.push({
        url,
        credits: credits && credits.trim() ? credits.trim() : null,
        debut: valeur(annotation, DEBUT)?.slice(0, 10) ?? null,
        fin: valeur(annotation, FIN)?.slice(0, 10) ?? null,
      });
    }
    if (liste.length > 0) medias.set(fiche, liste);
  }
  return medias;
}
