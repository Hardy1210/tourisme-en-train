// Base de test réelle, préparée par `pnpm db:test:preparer`.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { charger, type PlanChargement } from '../src/chargement/base';
import { auMoins, ErreurControles } from '../src/controles/base';
import { creerPool } from '../src/db';

function urlTestEtl(): string {
  if (!process.env.BDD_URL_ETL) throw new Error('BDD_URL_ETL manquante (voir .env.example).');
  const adresse = new URL(process.env.BDD_URL_ETL);
  adresse.pathname = `${adresse.pathname}_test`;
  return adresse.toString();
}

const pool = creerPool(urlTestEtl());
const SOURCE = 'essai_chargement';

beforeEach(async () => {
  await pool.query(
    `INSERT INTO source_donnees (code, nom, producteur, url, licence, attribution)
     VALUES ($1, 'Essai', 'Test', 'https://exemple.fr', 'L', 'Att')`,
    [SOURCE],
  );
  return () => pool.query('DELETE FROM source_donnees WHERE code = $1', [SOURCE]);
});
afterAll(() => pool.end());

async function* lignes() {
  yield { nom: 'Dijon-Ville', codes: ['87713040'] };
  yield { nom: 'Le "Creusot"', codes: ['87694000', '87694001'] };
}

function plan(minimum: number): PlanChargement<{ nom: string; codes: string[] }> {
  return {
    source: SOURCE,
    tableTemporaire: {
      nom: 'tmp_essai',
      colonnes: [
        ['nom', 'text'],
        ['codes', 'text[]'],
      ],
    },
    lignes: lignes(),
    versValeurs: (l) => [l.nom, l.codes],
    controles: [auMoins('au moins N lignes', 'SELECT count(*)::int AS n FROM tmp_essai', minimum)],
    // Fusion d'essai : vérifie le contenu de la table temporaire sans toucher une vraie table.
    fusionner: async (client) => {
      const { rows } = await client.query(
        'SELECT count(*)::int AS n FROM tmp_essai WHERE nom = \'Le "Creusot"\' AND cardinality(codes) = 2',
      );
      return rows[0].n === 1 ? 2 : 0;
    },
  };
}

async function etatSource() {
  const { rows } = await pool.query(
    'SELECT empreinte, nb_lignes FROM source_donnees WHERE code = $1',
    [SOURCE],
  );
  return rows[0];
}

describe('charger', () => {
  it('copie, contrôle, fusionne et enregistre l’empreinte', async () => {
    const bilan = await charger(pool, plan(2), 'abc123');
    expect(bilan).toMatchObject({ copiees: 2, chargees: 2 });
    expect(bilan.controles[0]).toMatchObject({ reussi: true });
    expect(await etatSource()).toEqual({ empreinte: 'abc123', nb_lignes: 2 });
  });

  it('contrôle bloquant en échec → erreur, et rien n’est enregistré', async () => {
    await expect(charger(pool, plan(3), 'abc123')).rejects.toBeInstanceOf(ErreurControles);
    expect(await etatSource()).toEqual({ empreinte: null, nb_lignes: null });
  });
});
