// Nettoyage d'une description de lieu (D105) : texte brut, paragraphes gardés, entités HTML décodées,
// coupe à une fin de phrase quand c'est possible. Calcul pur, partagé par DATAtourisme et OpenStreetMap.

/** Entités nommées décodées : celles du HTML de base et les courantes en français. Les autres restent telles quelles. */
const ENTITES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  thinsp: ' ',
  ensp: ' ',
  emsp: ' ',
  shy: '',
  agrave: 'à',
  aacute: 'á',
  acirc: 'â',
  auml: 'ä',
  ccedil: 'ç',
  egrave: 'è',
  eacute: 'é',
  ecirc: 'ê',
  euml: 'ë',
  icirc: 'î',
  iuml: 'ï',
  ocirc: 'ô',
  ouml: 'ö',
  ugrave: 'ù',
  ucirc: 'û',
  uuml: 'ü',
  yuml: 'ÿ',
  oelig: 'œ',
  aelig: 'æ',
  Agrave: 'À',
  Acirc: 'Â',
  Ccedil: 'Ç',
  Egrave: 'È',
  Eacute: 'É',
  Ecirc: 'Ê',
  Icirc: 'Î',
  Ocirc: 'Ô',
  Ugrave: 'Ù',
  Ucirc: 'Û',
  OElig: 'Œ',
  AElig: 'Æ',
  laquo: '«',
  raquo: '»',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  middot: '·',
  bull: '•',
  euro: '€',
  deg: '°',
  ordm: 'º',
  ordf: 'ª',
  sup2: '²',
  sup3: '³',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
  times: '×',
  copy: '©',
  reg: '®',
  trade: '™',
};

const MOTIF_ENTITE = /&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi;

/** Texte de l'entité `code` (« eacute », « #233 », « #xE9 ») ; undefined si on ne sait pas la décoder. */
function decoderEntite(code: string): string | undefined {
  if (code.startsWith('#')) {
    const point =
      code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
    return Number.isInteger(point) && point > 0 && point <= 0x10ffff
      ? String.fromCodePoint(point)
      : undefined;
  }
  return ENTITES[code] ?? ENTITES[code.toLowerCase()];
}

/** Les entités qu'on ne sait pas décoder, dans l'ordre (pour le rapport du traitement). */
export function entitesInconnues(texte: string): string[] {
  return [...texte.matchAll(MOTIF_ENTITE)]
    .filter(([, code = '']) => decoderEntite(code) === undefined)
    .map(([entite]) => entite);
}

/** Lignes unifiées, espaces en trop retirés, plusieurs lignes vides → un seul saut de paragraphe. */
function normaliserEspaces(texte: string): string {
  const lignes = texte
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((ligne) => ligne.replace(/[^\S\n]+/g, ' ').trim());
  const gardees: string[] = [];
  for (const ligne of lignes) {
    if (ligne === '' && (gardees.length === 0 || gardees.at(-1) === '')) continue;
    gardees.push(ligne);
  }
  while (gardees.at(-1) === '') gardees.pop();
  return gardees.join('\n');
}

/** Part de la longueur permise qu'une coupe en fin de phrase doit garder ; sinon, coupe au mot (D105). */
const PART_MIN_FIN_DE_PHRASE = 0.8;
const SUITE = '…';

/** Coupe un texte trop long : après la dernière phrase entière si elle garde assez de texte, sinon au mot près. */
function couper(texte: string, max: number): string {
  const limite = max - 2; // place pour « … » précédé d'une espace
  let finDePhrase = -1;
  for (const m of texte.matchAll(/[.!?…]+(?=\s|$)/g)) {
    const fin = m.index + m[0].length;
    if (fin > limite) break;
    finDePhrase = fin;
  }
  if (finDePhrase >= max * PART_MIN_FIN_DE_PHRASE) return `${texte.slice(0, finDePhrase)} ${SUITE}`;
  const debut = texte.slice(0, max - 1);
  const dernierBlanc = Math.max(debut.lastIndexOf(' '), debut.lastIndexOf('\n'));
  const coupe = dernierBlanc > 0 ? debut.slice(0, dernierBlanc) : debut;
  return `${coupe.replace(/[\s,;:.]+$/, '')}${SUITE}`;
}

/**
 * Description propre : balises retirées (`<br>` → retour à la ligne, `</p>` → paragraphe), entités décodées,
 * paragraphes gardés, coupée au-delà de `max` caractères. Texte vide → null.
 */
export function nettoyerDescription(texte: string | null | undefined, max: number): string | null {
  const sansHtml = (texte ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(MOTIF_ENTITE, (entite, code: string) => decoderEntite(code) ?? entite);
  const propre = normaliserEspaces(sansHtml);
  if (propre === '') return null;
  return propre.length <= max ? propre : couper(propre, max);
}
