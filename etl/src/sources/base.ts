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

/** Erreur HTTP d'un téléchargement : `statut` dit s'il vaut la peine de réessayer. */
export class ErreurTelechargement extends Error {
  constructor(
    readonly statut: number,
    url: string,
  ) {
    super(`Téléchargement refusé : HTTP ${statut} (${url})`);
    this.name = 'ErreurTelechargement';
  }
}

/** Serveur saturé ou passerelle en échec : le serveur invite à réessayer plus tard. */
const STATUTS_PASSAGERS = new Set([429, 502, 503, 504]);

/**
 * Relance `action` quand le serveur est saturé, en doublant l'attente à chaque fois (ce que
 * demande Overpass). Toute autre erreur, ou la dernière tentative, remonte telle quelle.
 */
export async function avecReessais<T>(
  action: () => Promise<T>,
  options: {
    tentatives: number;
    premiereAttenteMs: number;
    attendre?: (ms: number) => Promise<void>;
    signaler?: (tentative: number, attenteMs: number) => void;
    /** Erreurs propres à la source qui valent aussi une nouvelle tentative. */
    passagere?: (erreur: unknown) => boolean;
  },
): Promise<T> {
  const attendre = options.attendre ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)));
  for (let tentative = 1; ; tentative += 1) {
    try {
      return await action();
    } catch (erreur) {
      const passagere =
        (erreur instanceof ErreurTelechargement && STATUTS_PASSAGERS.has(erreur.statut)) ||
        (options.passagere?.(erreur) ?? false);
      if (!passagere || tentative >= options.tentatives) throw erreur;
      const attenteMs = options.premiereAttenteMs * 2 ** (tentative - 1);
      options.signaler?.(tentative, attenteMs);
      await attendre(attenteMs);
    }
  }
}

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
  requete?: RequestInit,
): Promise<{ empreinte: string; taille: number }> {
  await mkdir(path.dirname(chemin), { recursive: true });
  const reponse = await fetch(url, requete);
  if (!reponse.ok || !reponse.body) {
    throw new ErreurTelechargement(reponse.status, url);
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

/**
 * Téléchargement d'un gros fichier (export national DATAtourisme, 1,9 Go) que le serveur coupe parfois en
 * plein envoi (vu deux fois le 17/11) : chaque nouvelle tentative **reprend** là où le fichier s'est arrêté
 * (`Range`), au lieu de tout recommencer. Serveur sans reprise (réponse 200) : on repart du début. Comme
 * `telecharger`, le fichier précédent n'est remplacé qu'une fois le nouveau complet.
 */
export async function telechargerAvecReprise(
  url: string,
  chemin: string,
  options: { tentatives: number; attenteMs?: number; attendre?: (ms: number) => Promise<void> },
): Promise<{ empreinte: string; taille: number }> {
  const attendre = options.attendre ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)));
  await mkdir(path.dirname(chemin), { recursive: true });
  const partiel = `${chemin}.partiel`;
  await rm(partiel, { force: true });
  let total: number | null = null;
  for (let tentative = 1; ; tentative += 1) {
    const deja = (await stat(partiel).catch(() => null))?.size ?? 0;
    try {
      const reponse = await fetch(url, deja > 0 ? { headers: { Range: `bytes=${deja}-` } } : {});
      if (!reponse.ok || !reponse.body) throw new ErreurTelechargement(reponse.status, url);
      const reprise = reponse.status === 206;
      const annonce = reprise
        ? /\/(\d+)$/.exec(reponse.headers.get('content-range') ?? '')?.[1]
        : reponse.headers.get('content-length');
      if (annonce) total = Number(annonce);
      await pipeline(
        Readable.fromWeb(reponse.body as ReadableStream<Uint8Array>),
        createWriteStream(partiel, { flags: reprise ? 'a' : 'w' }),
      );
      const taille = (await stat(partiel)).size;
      if (total !== null && taille < total)
        throw new Error(`Fichier incomplet : ${taille} / ${total} octets`);
      await rename(partiel, chemin);
      return { empreinte: await empreinteFichier(chemin), taille };
    } catch (erreur) {
      const definitive =
        erreur instanceof ErreurTelechargement && !STATUTS_PASSAGERS.has(erreur.statut);
      if (definitive || tentative >= options.tentatives) {
        await rm(partiel, { force: true });
        throw erreur;
      }
      await attendre(options.attenteMs ?? 30_000);
    }
  }
}

/** Télécharge le fichier de la source, ou réutilise celui de `data/brut/` en mode hors ligne. */
export async function obtenirFichier(
  source: SourceDonnees,
  options: {
    dossierDonnees: string;
    nomFichier: string;
    horsLigne: boolean;
    /** Requête POST (Overpass) ; GET par défaut. */
    requete?: RequestInit;
  },
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
  const { empreinte, taille } = await telecharger(source.telechargement, chemin, options.requete);
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
