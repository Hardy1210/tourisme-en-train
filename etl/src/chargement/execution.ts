// Déroulé commun d'une source (docs/04-traitement-donnees.md § 1, principes 7 et 8) :
// ligne `execution_etl` ouverte (EN_COURS) → traitement → statut final → rapport Markdown.
// Le journal s'écrit HORS de la transaction de chargement : un ECHEC reste enregistré après l'annulation.
import { journal, maintenantParis } from '@tourisme/commun';
import type pg from 'pg';
import { ErreurControles } from '../controles/base';
import { enregistrerRapport, type Statut, type Suivi } from './rapport';

export async function commencerExecution(pool: pg.Pool, source: string): Promise<number> {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO execution_etl (source, debut, statut)
     VALUES ($1, clock_timestamp(), 'EN_COURS') RETURNING id`,
    [source],
  );
  return Number(rows[0]?.id);
}

/** Clôt l'exécution ; renvoie sa durée en secondes (mesurée par la base, pas par l'horloge du code). */
export async function terminerExecution(
  pool: pg.Pool,
  id: number,
  fin: { statut: Statut; nbLignes: number | null; message: string | null },
): Promise<number> {
  const { rows } = await pool.query<{ duree_s: number }>(
    `UPDATE execution_etl SET fin = clock_timestamp(), statut = $2, nb_lignes = $3, message = $4
     WHERE id = $1 RETURNING extract(epoch FROM fin - debut)::float8 AS duree_s`,
    [id, fin.statut, fin.nbLignes, fin.message],
  );
  return rows[0]?.duree_s ?? 0;
}

/**
 * Exécute `traitement` en le journalisant. Le traitement remplit `suivi` au fur et à mesure et
 * renvoie SUCCES ou IGNORE ; une erreur devient ECHEC, est enregistrée, puis relancée (code retour ≠ 0).
 */
export async function executerSource(
  contexte: { pool: pg.Pool; dossierDonnees: string },
  source: string,
  traitement: (suivi: Suivi) => Promise<'SUCCES' | 'IGNORE'>,
): Promise<Statut> {
  const { dateDuJour, heureActuelleS } = maintenantParis();
  const id = await commencerExecution(contexte.pool, source);
  const suivi: Suivi = { remarques: [] };

  let statut: Statut;
  let message: string | null = null;
  let erreur: unknown = null;
  try {
    statut = await traitement(suivi);
    if (statut === 'IGNORE') message = 'Fichier inchangé depuis le dernier chargement.';
  } catch (e) {
    statut = 'ECHEC';
    erreur = e;
    message = e instanceof Error ? e.message : String(e);
    if (e instanceof ErreurControles) suivi.controles = [...e.resultats];
  }

  const nbLignes = suivi.chargees ?? null;
  const dureeS = await terminerExecution(contexte.pool, id, { statut, nbLignes, message });
  const chemin = await enregistrerRapport(contexte.dossierDonnees, {
    ...suivi,
    source,
    date: dateDuJour,
    heureS: heureActuelleS,
    statut,
    message,
    dureeS,
  });
  journal.info('Rapport écrit', { source, statut, rapport: chemin });

  if (erreur !== null) throw erreur;
  return statut;
}
