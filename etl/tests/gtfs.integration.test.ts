// GTFS miniature (etl/tests/donnees/gtfs_mini, voir son LISEZMOI) sur la base de test réelle.
// Chaque test crée ses gares fictives dans une transaction toujours annulée.
import path from 'node:path';
import type pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';
import { chargerGtfsDans, preparerGtfs } from '../src/chargement/gtfs';
import { depuisDossier } from '../src/chargement/gtfs-brut';
import { ErreurControles } from '../src/controles/base';
import { creerPool, enTransaction } from '../src/db';

function urlTestEtl(): string {
  if (!process.env.BDD_URL_ETL) throw new Error('BDD_URL_ETL manquante (voir .env.example).');
  const adresse = new URL(process.env.BDD_URL_ETL);
  adresse.pathname = `${adresse.pathname}_test`;
  return adresse.toString();
}

const pool = creerPool(urlTestEtl());
afterAll(() => pool.end());

const MINI = depuisDossier(path.join(import.meta.dirname, 'donnees', 'gtfs_mini'));

class Annulation extends Error {}

/** Exécute `travail` avec les 4 gares fictives, puis annule tout. */
async function avecGares(travail: (client: pg.PoolClient) => Promise<void>, gares = true) {
  await expect(
    enTransaction(pool, async (client) => {
      if (gares) {
        await client.query(`INSERT INTO gare (uic, codes_uic, nom, dans_region, geom)
          SELECT uic, ARRAY[uic], nom, region, ST_MakePoint(5, 47)::geography FROM (VALUES
            ('87000010', 'Alpha', true), ('87000020', 'Beta', true),
            ('87000030', 'Gamma (hors région)', false), ('87000040', 'Delta', true)
          ) AS g (uic, nom, region)`);
      }
      await travail(client);
      throw new Annulation();
    }),
  ).rejects.toBeInstanceOf(Annulation);
}

async function joursDe(client: pg.PoolClient, service: string): Promise<string[]> {
  const { rows } = await client.query<{ d: string }>(
    "SELECT to_char(date_service, 'YYYY-MM-DD') AS d FROM tmp_service_jour WHERE service_id = $1 ORDER BY 1",
    [service],
  );
  return rows.map((r) => r.d);
}

describe('calendrier déplié (calendar.txt + calendar_dates.txt)', () => {
  it('lundi → vendredi, exceptions, changement d’heure, bornes de la fenêtre', async () => {
    await avecGares(async (client) => {
      await preparerGtfs(client, MINI, { debut: '2026-10-20', jours: 12 }); // 20/10 → 01/11
      const jours = await joursDe(client, 'SEM');
      expect(jours).toContain('2026-10-20'); // mardi : présent
      expect(jours).not.toContain('2026-11-01'); // dimanche : absent
      expect(jours).not.toContain('2026-10-27'); // mardi retiré (exception 2)
      expect(jours).toContain('2026-10-25'); // dimanche ajouté (exception 1, jour du changement d'heure)
      expect(jours).not.toContain('2026-10-24'); // samedi avant le changement d'heure : absent
      expect(jours).toContain('2026-10-26'); // lundi après le changement d'heure : présent
      expect(jours).not.toContain('2026-10-19'); // lundi, mais avant la fenêtre
    });
  });

  it('service défini seulement par calendar_dates : ses jours, rien d’autre', async () => {
    await avecGares(async (client) => {
      await preparerGtfs(client, MINI, { debut: '2026-10-20', jours: 12 });
      expect(await joursDe(client, 'NUIT')).toEqual(['2026-10-24', '2026-10-26']);
    });
  });
});

describe('chargement complet (fenêtre du 24 au 26/10)', () => {
  const fenetre = { debut: '2026-10-24', jours: 2 };

  it('trajets retenus, types, numéros ; cars et trajets hors région écartés', async () => {
    await avecGares(async (client) => {
      const bilan = await chargerGtfsDans(client, MINI, fenetre, null);
      expect(bilan.trajets).toBe(4);
      const { rows } = await client.query(
        'SELECT id, type_train, numero, nom_ligne FROM trajet ORDER BY id',
      );
      expect(rows).toEqual([
        { id: 'T_AUTRE', type_train: 'AUTRE', numero: '9001', nom_ligne: 'PB' },
        { id: 'T_NUIT', type_train: 'INTERCITES', numero: '4295', nom_ligne: 'IC9' },
        { id: 'T_TER', type_train: 'TER', numero: '17821', nom_ligne: 'K7' },
        { id: 'T_TGV', type_train: 'TGV', numero: '6701', nom_ligne: '071B' },
      ]);
    });
  });

  it('heures en secondes, après minuit comprises', async () => {
    await avecGares(async (client) => {
      await chargerGtfsDans(client, MINI, fenetre, null);
      const { rows } = await client.query(
        `SELECT g.nom, p.arrivee_s, p.depart_s FROM passage p JOIN gare g ON g.id = p.gare_id
         WHERE p.trajet_id = 'T_NUIT' ORDER BY p.sequence`,
      );
      expect(rows[2]).toEqual({ nom: 'Alpha', arrivee_s: 90_600, depart_s: 90_720 }); // 25:10 / 25:12
      expect(rows[0]).toMatchObject({ nom: 'Gamma (hors région)', depart_s: 85_800 }); // 23:50
    });
  });

  it('montée interdite à un arrêt intermédiaire, possible ailleurs ; gare étrangère écartée', async () => {
    await avecGares(async (client) => {
      await chargerGtfsDans(client, MINI, fenetre, null);
      const { rows } = await client.query(
        `SELECT g.nom, p.montee_interdite, p.descente_interdite FROM passage p
         JOIN gare g ON g.id = p.gare_id WHERE p.trajet_id = 'T_TGV' ORDER BY p.sequence`,
      );
      expect(rows).toEqual([
        { nom: 'Alpha', montee_interdite: false, descente_interdite: true },
        { nom: 'Beta', montee_interdite: true, descente_interdite: false },
        { nom: 'Gamma (hors région)', montee_interdite: true, descente_interdite: false },
      ]);
    });
  });

  it('jours de circulation des seuls trajets retenus', async () => {
    await avecGares(async (client) => {
      await chargerGtfsDans(client, MINI, fenetre, null);
      const { rows } = await client.query(
        "SELECT service_id, to_char(date_service, 'MM-DD') AS d FROM service_jour ORDER BY 1, 2",
      );
      expect(rows.map((r) => `${r.service_id} ${r.d}`)).toEqual([
        'AUTRE 10-26',
        'NUIT 10-24',
        'NUIT 10-26',
        'SEM 10-25',
        'SEM 10-26',
        'TGV 10-26',
      ]);
    });
  });

  it('contrôles au vert et constats du rapport', async () => {
    await avecGares(async (client) => {
      const bilan = await chargerGtfsDans(client, MINI, fenetre, null);
      expect(bilan.controles.every((c) => c.reussi)).toBe(true);
      expect(bilan.constats).toContain(
        'Trajets en car ou navette exclus : 1 dans le fichier, dont 1 touchant la région',
      );
      expect(bilan.constats).toContain(
        'Trajets AUTRE (mode inconnu) : 1 chargés, 1 dans tout le fichier',
      );
      expect(bilan.constats.join('\n')).toContain('Basel SBB (1)');
    });
  });

  it('aucune gare connue → contrôle de rapprochement bloquant, rien n’est écrit', async () => {
    await avecGares(async (client) => {
      await expect(chargerGtfsDans(client, MINI, fenetre, null)).rejects.toBeInstanceOf(
        ErreurControles,
      );
    }, false);
  });
});
