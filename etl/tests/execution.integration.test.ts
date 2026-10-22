// Base de test réelle, préparée par `pnpm db:test:preparer`.
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { dateDuJour } from '@tourisme/commun';
import { executerSource } from '../src/chargement/execution';
import { creerPool } from '../src/db';

function urlTestEtl(): string {
  if (!process.env.BDD_URL_ETL) throw new Error('BDD_URL_ETL manquante (voir .env.example).');
  const adresse = new URL(process.env.BDD_URL_ETL);
  adresse.pathname = `${adresse.pathname}_test`;
  return adresse.toString();
}

const pool = creerPool(urlTestEtl());
const SOURCE = 'essai_execution';
let dossierDonnees: string;

beforeEach(async () => {
  dossierDonnees = await mkdtemp(path.join(tmpdir(), 'etl-execution-'));
  return async () => {
    await pool.query('DELETE FROM execution_etl WHERE source = $1', [SOURCE]);
    await rm(dossierDonnees, { recursive: true, force: true });
  };
});
afterAll(() => pool.end());

async function derniereExecution() {
  const { rows } = await pool.query(
    `SELECT statut, nb_lignes, message, fin >= debut AS terminee FROM execution_etl
     WHERE source = $1 ORDER BY id DESC LIMIT 1`,
    [SOURCE],
  );
  return rows[0];
}

const lireRapport = () =>
  readFile(path.join(dossierDonnees, 'traite', 'rapports', `${dateDuJour()}_${SOURCE}.md`), 'utf8');

describe('executerSource', () => {
  it('SUCCES : journal clos avec le nombre de lignes, rapport écrit', async () => {
    const statut = await executerSource({ pool, dossierDonnees }, SOURCE, async (suivi) => {
      suivi.lecture = { lues: 3, rejets: [] };
      suivi.chargees = 3;
      return 'SUCCES';
    });
    expect(statut).toBe('SUCCES');
    expect(await derniereExecution()).toEqual({
      statut: 'SUCCES',
      nb_lignes: 3,
      message: null,
      terminee: true,
    });
    expect(await lireRapport()).toContain('- **Statut :** SUCCES');
  });

  it('IGNORE : fichier inchangé, noté dans le journal', async () => {
    await executerSource({ pool, dossierDonnees }, SOURCE, async () => 'IGNORE');
    expect(await derniereExecution()).toMatchObject({ statut: 'IGNORE', nb_lignes: null });
  });

  it('ECHEC : erreur relancée, mais journal et rapport gardent ce qui était connu', async () => {
    await expect(
      executerSource({ pool, dossierDonnees }, SOURCE, async (suivi) => {
        suivi.lecture = { lues: 2, rejets: [{ ligne: 3, raison: 'uic : invalide' }] };
        throw new Error('panne simulée');
      }),
    ).rejects.toThrow('panne simulée');
    expect(await derniereExecution()).toMatchObject({ statut: 'ECHEC', message: 'panne simulée' });
    const rapport = await lireRapport();
    expect(rapport).toContain('- **Statut :** ECHEC');
    expect(rapport).toContain('1 × uic : invalide (lignes 3)');
  });
});
