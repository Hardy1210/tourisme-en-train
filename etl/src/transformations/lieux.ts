// Nettoyage commun des lieux, toutes sources (docs/04-traitement-donnees.md § 4.4, point 4).
// Fonctions pures : aucune lecture de fichier, de base ni d'horloge.

/** Lieu normalisé, prêt pour la table temporaire ; la commune est trouvée ensuite en SQL (D041). */
export interface LieuNormalise {
  idSource: string;
  nom: string;
  categorie: string;
  sousCategorie: string | null;
  description: string | null;
  adresse: string | null;
  url: string | null;
  imageUrl: string | null;
  /** Lien vers l'article Wikipédia (OSM) ; null sinon (D092). */
  wikipedia: string | null;
  horaires: string | null;
  qualiteTourisme: boolean;
  lon: number;
  lat: number;
  /** Tracé d'un lieu en longueur (canal), GeoJSON LineString ; null sinon (D043). */
  trace: string | null;
}

/** Lieu prêt à charger : ses catégories secondaires sont ajoutées après le classement (D060). */
export type LieuACharger = LieuNormalise & { categoriesSecondaires: readonly string[] };

/** Lieu chargé en base : `masque` le cache de tous les écrans sans le supprimer (D093). */
export type LieuMasquable = LieuACharger & { masque: boolean };

/** Pourquoi une ligne de source n'est pas devenue un lieu (compté dans le rapport). */
export type RaisonEcart =
  'exclu' | 'non_classe' | 'condition' | 'sans_position' | 'doublon' | 'nom_exclu' | 'correction';

export const LIBELLES_ECART: Readonly<Record<RaisonEcart, string>> = {
  exclu: 'écartés par une règle (hébergement, restauration, commerce, événement, générique…)',
  non_classe: 'sans aucune règle de catégorie',
  condition: 'sans nom, ou sans signe de sortie quand la règle en demande un',
  sans_position: 'sans position',
  doublon: 'identifiant déjà lu dans le fichier (même lieu publié par deux diffuseurs)',
  nom_exclu: 'écartés par leur nom (activité, objet, fermé : regles/noms_exclus.csv)',
  correction: 'retirés par une correction manuelle (regles/corrections_manuelles.csv)',
};

const ENTITES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Espaces multiples, retours à la ligne et tabulations → une espace ; texte vide → null. */
export function texteOuNull(texte: string | null | undefined): string | null {
  const propre = (texte ?? '').replace(/\s+/g, ' ').trim();
  return propre === '' ? null : propre;
}

/** Retire les balises HTML, décode les entités courantes, coupe au mot près au-delà de `max` caractères. */
export function nettoyerDescription(texte: string | null | undefined, max: number): string | null {
  const sansHtml = (texte ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#\d+|[a-z]+);/gi, (entite, code: string) => {
      if (code.startsWith('#')) return String.fromCodePoint(Number(code.slice(1)));
      return ENTITES[code.toLowerCase()] ?? entite;
    });
  const propre = texteOuNull(sansHtml);
  if (propre === null || propre.length <= max) return propre;
  const coupe = propre.slice(0, max - 1);
  const dernierEspace = coupe.lastIndexOf(' ');
  return `${(dernierEspace > 0 ? coupe.slice(0, dernierEspace) : coupe).replace(/[\s,;:.]+$/, '')}…`;
}

/** Petits mots laissés en minuscules dans un nom remis en casse normale (sauf en tête). */
const PETITS_MOTS = new Set([
  'de',
  'du',
  'des',
  'la',
  'le',
  'les',
  'et',
  'à',
  'au',
  'aux',
  'en',
  'sur',
  'sous',
]);

const majuscule = (mot: string): string => mot.charAt(0).toUpperCase() + mot.slice(1);

/**
 * Nom propre : espaces normalisés ; un nom tout en majuscules repasse en casse normale
 * (« CHÂTEAU DE BUSSY-RABUTIN » → « Château de Bussy-Rabutin »). Les autres noms sont gardés tels quels.
 */
export function normaliserNom(nom: string): string {
  const propre = texteOuNull(nom) ?? '';
  if (!/\p{Lu}/u.test(propre) || /\p{Ll}/u.test(propre)) return propre;
  return propre
    .toLowerCase()
    .split(' ')
    .map((mot, i) => {
      if (i > 0 && PETITS_MOTS.has(mot)) return mot;
      // « d'artagnan » → « d'Artagnan », « saint-jean » → « Saint-Jean ».
      const parties = mot.split('-').map((partie) => {
        const elision = /^([dl]['’])(.+)$/.exec(partie);
        return elision ? `${elision[1]}${majuscule(elision[2] ?? '')}` : majuscule(partie);
      });
      const resultat = parties.join('-');
      return i === 0 ? majuscule(resultat) : resultat;
    })
    .join(' ');
}

/** Adresse web http(s) valide, normalisée ; sinon null. */
export function urlValide(texte: string | null | undefined): string | null {
  const brut = texteOuNull(texte);
  if (brut === null) return null;
  try {
    const url = new URL(brut);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
