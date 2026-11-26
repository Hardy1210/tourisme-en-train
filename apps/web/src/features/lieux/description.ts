// Quel texte montrer dans la fiche d'un lieu (D123) : une décision pure, testable sans base.
// Ordre : nos propres textes (`wagoo`), la description des sources de `descriptionsAvantWikipedia`
// (DATAtourisme), le texte Wikipédia, puis la description des autres sources (OSM : souvent quelques mots).
import type { OrigineDescription } from '@tourisme/commun';

/** Une ligne de `description_lieu` (docs/03 § 3.6 quater). */
export interface DescriptionAjoutee {
  origine: OrigineDescription;
  texte: string;
  credit: string;
  licence: string | null;
  lien: string | null;
}

export interface DescriptionChoisie {
  texte: string;
  /** Le texte ajouté retenu ; null = la description de la source du lieu (créditée par son attribution). */
  ajoutee: DescriptionAjoutee | null;
}

const rempli = (texte: string | null): texte is string => texte !== null && texte.trim() !== '';

export function choisirDescription({
  source,
  description,
  ajoutees,
  sourcesAvantWikipedia,
}: {
  /** Code de la source du lieu (`datatourisme`, `osm`…). */
  source: string;
  /** `lieu.description` : le texte de la source du lieu. */
  description: string | null;
  ajoutees: readonly DescriptionAjoutee[];
  sourcesAvantWikipedia: readonly string[];
}): DescriptionChoisie | null {
  const ajoutee = (origine: OrigineDescription) =>
    ajoutees.find((a) => a.origine === origine && rempli(a.texte)) ?? null;
  const depuis = (a: DescriptionAjoutee | null) => (a ? { texte: a.texte, ajoutee: a } : null);
  const deLaSource = rempli(description) ? { texte: description, ajoutee: null } : null;

  return (
    depuis(ajoutee('wagoo')) ??
    (sourcesAvantWikipedia.includes(source) ? deLaSource : null) ??
    depuis(ajoutee('wikipedia')) ??
    deLaSource
  );
}
