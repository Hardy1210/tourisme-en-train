// Lieux écartés par leur nom (docs/04-traitement-donnees.md § 4.5, D045) : activités (« Visite guidée… »),
// objets (« Retable de l'église… »), lieux fermés. Fonctions pures, testées.

export interface MotifExclu {
  /** Texte comparable (minuscules, sans accents ni ponctuation). */
  texte: string;
  /** true = seulement en début de nom (motif écrit `^…` dans le fichier). */
  debut: boolean;
  raison: string;
}

/** Minuscules, sans accents, ponctuation → espace (« L'Orgue » → « l orgue »). */
export function texteComparable(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Article en tête retiré pour la recherche en début de nom (« Le retable… » commence par « retable »). */
const sansArticle = (texte: string): string => texte.replace(/^(le|la|les|l) /, '');

export function lireMotif(motif: string, raison: string): MotifExclu {
  const debut = motif.trimStart().startsWith('^');
  return { texte: texteComparable(motif.replace('^', '')), debut, raison };
}

/** Premier motif qui écarte ce nom, ou null. Recherche par mots entiers. */
export function motifQuiExclut(nom: string, motifs: readonly MotifExclu[]): MotifExclu | null {
  const texte = sansArticle(texteComparable(nom));
  return (
    motifs.find((m) =>
      m.debut
        ? texte === m.texte || texte.startsWith(`${m.texte} `)
        : ` ${texte} `.includes(` ${m.texte} `),
    ) ?? null
  );
}
