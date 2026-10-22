// Socle du téléchargement des sources (docs/04-traitement-donnees.md § 1, principes 4 et 7).
// Le fichier brut est rangé dans <DOSSIER_DONNEES>/brut/<source>/ ; son empreinte SHA-256,
// comparée à `source_donnees.empreinte`, dit si la source a changé depuis le dernier chargement.
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream } from 'node:stream/web';
import type { SourceDonnees } from '@tourisme/commun';
import type pg from 'pg';

export interface FichierBrut {
  chemin: string;
  /** SHA-256 en hexadécimal. */
  empreinte: string;
  /** Taille en octets. */
  taille: number;
  /** false = mode hors ligne : fichier déjà présent, réutilisé sans téléchargement. */
  telecharge: boolean;
}

export function cheminFichierBrut(
  dossierDonnees: string,
  code: string,
  nomFichier: string,
): string {
  return path.join(dossierDonnees, 'brut', code, nomFichier);
}

/** Fichier inchangé = même empreinte que le dernier chargement réussi ; `--force` retraite quand même. */
export function estInchange(
  empreinte: string,
  empreinteConnue: string | null,
  force: boolean,
): boolean {
  return !force && empreinteConnue !== null && empreinte === empreinteConnue;
}

/** Empreinte d'un fichier déjà présent, lu en flux (jamais entièrement en mémoire). */
export async function empreinteFichier(chemin: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const morceau of createReadStream(chemin)) hash.update(morceau as Buffer);
  return hash.digest('hex');
}

/**
 * Télécharge en flux vers un fichier `.partiel`, puis le renomme : un téléchargement interrompu
 * ne remplace jamais le fichier précédent (celui que `--hors-ligne` réutilisera).
 */
export async function telecharger(
  url: string,
  chemin: string,
): Promise<{ empreinte: string; taille: number }> {
  await mkdir(path.dirname(chemin), { recursive: true });
  const reponse = await fetch(url);
  if (!reponse.ok || !reponse.body) {
    throw new Error(`Téléchargement refusé : HTTP ${reponse.status} (${url})`);
  }

  const hash = createHash('sha256');
  let taille = 0;
  const hacheur = new Transform({
    transform(morceau: Buffer, _encodage, suite) {
      hash.update(morceau);
      taille += morceau.length;
      suite(null, morceau);
    },
  });

  const partiel = `${chemin}.partiel`;
  try {
    await pipeline(
      Readable.fromWeb(reponse.body as ReadableStream<Uint8Array>),
      hacheur,
      createWriteStream(partiel),
    );
  } catch (erreur) {
    await rm(partiel, { force: true });
    throw erreur;
  }
  await rename(partiel, chemin);
  return { empreinte: hash.digest('hex'), taille };
}

/** Télécharge le fichier de la source, ou réutilise celui de `data/brut/` en mode hors ligne. */
export async function obtenirFichier(
  source: SourceDonnees,
  options: { dossierDonnees: string; nomFichier: string; horsLigne: boolean },
): Promise<FichierBrut> {
  const chemin = cheminFichierBrut(options.dossierDonnees, source.code, options.nomFichier);

  if (options.horsLigne) {
    const infos = await stat(chemin).catch(() => null);
    if (!infos) {
      throw new Error(
        `Mode hors ligne : fichier absent (${chemin}). Lancez une fois sans --hors-ligne.`,
      );
    }
    return {
      chemin,
      empreinte: await empreinteFichier(chemin),
      taille: infos.size,
      telecharge: false,
    };
  }

  if (!source.telechargement) {
    throw new Error(`Adresse de téléchargement absente de config/sources.json (${source.code})`);
  }
  const { empreinte, taille } = await telecharger(source.telechargement, chemin);
  return { chemin, empreinte, taille, telecharge: true };
}

/** Empreinte du dernier chargement réussi ; null si la source n'a encore jamais été chargée. */
export async function lireEmpreinteConnue(
  client: pg.ClientBase,
  code: string,
): Promise<string | null> {
  const { rows } = await client.query<{ empreinte: string | null }>(
    'SELECT empreinte FROM source_donnees WHERE code = $1',
    [code],
  );
  const ligne = rows[0];
  if (!ligne)
    throw new Error(`Source « ${code} » absente de source_donnees : lancez pnpm etl sources`);
  return ligne.empreinte;
}
