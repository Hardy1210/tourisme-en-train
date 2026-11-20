// Descriptions longues de nos fiches DATAtourisme dans l'export national RDF (D105) : deux passages sur le
// flux, comme pour les photos (fiche → core:hasDescription → nœud → dc:description). Français seulement.
import { lireLitteral, passage, type Lignes } from './datatourisme-photos';
import { nettoyerDescription } from './description';

const A_DESCRIPTION = 'https://www.datatourisme.fr/ontology/core#hasDescription';
const DESCRIPTION = 'http://purl.org/dc/elements/1.1/description';
const EN_FRANCAIS = /"@fr$/;

/** Fiche → sa description longue en français, brute (décodée du N-Triples), la plus longue si plusieurs. */
export async function lireDescriptionsDatatourisme(
  ouvrir: Lignes,
  fiches: ReadonlySet<string>,
): Promise<Map<string, string>> {
  const liens = await passage(ouvrir, fiches, new Set([A_DESCRIPTION]));
  const noeuds = new Set([...liens.values()].flat().map((t) => t.objet));
  const resultat = new Map<string, string>();
  if (noeuds.size === 0) return resultat;
  const textes = await passage(ouvrir, noeuds, new Set([DESCRIPTION]));
  for (const [fiche, triplets] of liens) {
    let meilleure: string | null = null;
    for (const { objet: noeud } of triplets) {
      for (const { objet } of textes.get(noeud) ?? []) {
        if (!EN_FRANCAIS.test(objet)) continue;
        const texte = lireLitteral(objet);
        if (texte?.trim() && (meilleure === null || texte.length > meilleure.length))
          meilleure = texte;
      }
    }
    if (meilleure !== null) resultat.set(fiche, meilleure);
  }
  return resultat;
}

/** Description gardée : celle de l'export, nettoyée, seulement si elle est plus longue que l'actuelle. */
export function descriptionRetenue(
  actuelle: string | null,
  exportee: string | null,
  max: number,
): string | null {
  const propre = nettoyerDescription(exportee, max);
  if (propre !== null && (actuelle === null || propre.length > actuelle.length)) return propre;
  return actuelle;
}
