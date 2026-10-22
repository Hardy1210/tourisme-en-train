// Lecture des fichiers .sql de transformations/ (fonctions pures, testées).
// Un fichier est découpé en sections `-- @nom` (une instruction chacune) ; les paramètres s'écrivent
// `:nom` (comme dans docs/03-base-de-donnees.md § 5) et deviennent `$1`, `$2`… pour le pilote `pg`.
import { readFile } from 'node:fs/promises';

/** `-- @nom` en début de ligne ouvre une section. */
const DEBUT_SECTION = /^-- @([a-z_]+)\s*$/m;

export function decouperSections(texte: string): Map<string, string> {
  const sections = new Map<string, string>();
  const morceaux = texte.split(DEBUT_SECTION);
  // morceaux = [avant la 1re section, nom1, corps1, nom2, corps2, …]
  for (let i = 1; i < morceaux.length; i += 2) {
    const nom = morceaux[i] as string;
    if (sections.has(nom)) throw new Error(`Section SQL « ${nom} » en double`);
    // Lignes de commentaire retirées : un `:nom` cité dans un commentaire n'est pas un paramètre.
    const corps = (morceaux[i + 1] ?? '')
      .split('\n')
      .filter((ligne) => !ligne.trimStart().startsWith('--'))
      .join('\n');
    sections.set(nom, corps.trim().replace(/;$/, ''));
  }
  return sections;
}

/**
 * `:nom` → `$k` (même nom = même numéro). Ne touche ni aux conversions `::type`, ni aux textes en
 * majuscules (`'^StopPoint:OCE…'`). Un nom sans valeur est une erreur.
 */
export function preparer(
  sql: string,
  valeurs: Readonly<Record<string, unknown>>,
): { texte: string; valeurs: unknown[] } {
  const ordre: string[] = [];
  const texte = sql.replace(/(?<!:):([a-z_][a-z0-9_]*)/g, (_, nom: string) => {
    if (!(nom in valeurs)) throw new Error(`Paramètre SQL « :${nom} » sans valeur`);
    if (!ordre.includes(nom)) ordre.push(nom);
    return `$${ordre.indexOf(nom) + 1}`;
  });
  return { texte, valeurs: ordre.map((nom) => valeurs[nom]) };
}

export async function lireSections(chemin: URL): Promise<Map<string, string>> {
  return decouperSections(await readFile(chemin, 'utf8'));
}
