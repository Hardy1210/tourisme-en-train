// Base de test réelle, préparée par `pnpm db:test:preparer` : horaires d'exemple de
// db/echantillon/echantillon.sql (ECH_SEMAINE le 15/07 et le 18/11, ECH_ETE le 15/07 seulement).
// Chaque test calcule les liaisons d'une journée dans une transaction annulée.
import type pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';
import { calculerLiaisonsDans } from '../src/chargement/liaisons';
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

class Annulation extends Error {}

interface Liaison {
  nb_trains: number;
  duree_min: number;
  types_train: string[];
  distance_km: number;
  faisable_journee: boolean;
}

/** Liaisons de `jour` après `preparation`, indexées par « UIC départ → UIC arrivée » ; tout est annulé. */
async function liaisonsDu(jour: string, preparation = ''): Promise<Map<string, Liaison>> {
  const resultat = new Map<string, Liaison>();
  await expect(
    enTransaction(pool, async (client: pg.PoolClient) => {
      if (preparation) await client.query(preparation);
      await calculerLiaisonsDans(client, { debut: jour, jours: 0 });
      const { rows } = await client.query<Liaison & { cle: string }>(
        `SELECT gd.uic || ' → ' || ga.uic AS cle, l.nb_trains, l.duree_min, l.types_train,
                l.distance_km::float8 AS distance_km, l.faisable_journee
         FROM liaison_directe l JOIN gare gd ON gd.id = l.gare_depart_id
         JOIN gare ga ON ga.id = l.gare_arrivee_id`,
      );
      for (const { cle, ...liaison } of rows) resultat.set(cle, liaison);
      throw new Annulation();
    }),
  ).rejects.toBeInstanceOf(Annulation);
  return resultat;
}

const DIJON = 'EX000001';
const BESANCON = 'EX000004';
const LYON = 'EX000010';
const PARIS = 'EX000011';

/** Trajet d'exemple supplémentaire (ECH_SEMAINE) : [UIC, arrivée, départ] dans l'ordre des arrêts. */
function trajet(
  id: string,
  type: string,
  arrets: [string, number | null, number | null][],
): string {
  const valeurs = arrets
    .map(([uic, arrivee, depart], i) => `('${id}', ${i + 1}, '${uic}', ${arrivee}, ${depart})`)
    .join(', ');
  return `INSERT INTO trajet (id, service_id, type_train) VALUES ('${id}', 'ECH_SEMAINE', '${type}');
    INSERT INTO passage (trajet_id, sequence, gare_id, arrivee_s, depart_s)
    SELECT p.t, p.s, g.id, p.a, p.d FROM (VALUES ${valeurs}) AS p (t, s, uic, a, d)
    JOIN gare g ON g.uic = p.uic;`;
}

describe('calculerLiaisonsDans (04 § 4.3, D040)', () => {
  it('A → C existe quand un trajet passe par A, B, C ; C → A n’existe pas sans trajet dans ce sens', async () => {
    const ete = await liaisonsDu('2026-07-15');
    expect(ete.has(`${DIJON} → ${BESANCON}`)).toBe(true);
    expect(ete.has(`${BESANCON} → ${DIJON}`)).toBe(false);
    // Aucun retour : pas faisable dans la journée.
    expect(ete.get(`${DIJON} → ${BESANCON}`)?.faisable_journee).toBe(false);
  });

  it('deux trains Dijon → Lyon le 18/11 : durée du plus rapide, types, distance estimée', async () => {
    const liaison = (await liaisonsDu('2026-11-18')).get(`${DIJON} → ${LYON}`);
    expect(liaison).toMatchObject({ nb_trains: 2, duree_min: 100, types_train: ['TER', 'TGV'] });
    // ≈ 175 km à vol d'oiseau × rail.coefDetour (1,2).
    expect(liaison?.distance_km).toBeGreaterThan(200);
    expect(liaison?.distance_km).toBeLessThan(220);
  });

  it('faisable dans la journée : arrivée 09:05 et retour 17:00 oui ; arrivée 19:06 non', async () => {
    const liaisons = await liaisonsDu('2026-11-18');
    expect(liaisons.get(`${DIJON} → ${LYON}`)?.faisable_journee).toBe(true);
    expect(liaisons.get(`${LYON} → ${DIJON}`)?.faisable_journee).toBe(false);
  });

  it('trains en jumelage (mêmes heures) comptés une fois ; un autre horaire compte en plus', async () => {
    const jumeau = trajet('ECH_T6', 'TGV', [
      [DIJON, null, 36_000],
      [LYON, 42_000, null],
    ]);
    const autre = trajet('ECH_T7', 'TGV', [
      [DIJON, null, 36_600],
      [LYON, 42_600, null],
    ]);
    expect((await liaisonsDu('2026-11-18', jumeau)).get(`${DIJON} → ${LYON}`)?.nb_trains).toBe(2);
    expect(
      (await liaisonsDu('2026-11-18', jumeau + autre)).get(`${DIJON} → ${LYON}`)?.nb_trains,
    ).toBe(3);
  });

  it('départ OU arrivée dans la région : Dijon → Paris gardé, Lyon → Paris écarté', async () => {
    const paris = `INSERT INTO gare (uic, codes_uic, nom, dans_region, geom) VALUES
      ('${PARIS}', '{${PARIS}}', 'Paris (exemple)', false, ST_MakePoint(2.37, 48.84)::geography);`;
    const passant = trajet('ECH_T8', 'TGV', [
      [DIJON, null, 50_000],
      [LYON, 56_000, 56_600],
      [PARIS, 64_000, null],
    ]);
    const liaisons = await liaisonsDu('2026-11-18', paris + passant);
    expect(liaisons.has(`${DIJON} → ${PARIS}`)).toBe(true);
    expect(liaisons.has(`${LYON} → ${PARIS}`)).toBe(false);
  });

  it('montée interdite à Dijon : la paire disparaît pour ce train seulement', async () => {
    const interdite = `UPDATE passage SET montee_interdite = true
      WHERE trajet_id = 'ECH_T5' AND sequence = 1;`;
    const liaison = (await liaisonsDu('2026-11-18', interdite)).get(`${DIJON} → ${LYON}`);
    expect(liaison).toMatchObject({ nb_trains: 1, types_train: ['TER'] });
  });
});

describe('contrôle « jours de la fenêtre sans aucune liaison »', () => {
  async function calculer(jours: number): Promise<unknown> {
    try {
      await enTransaction(pool, async (client) => {
        await calculerLiaisonsDans(client, { debut: '2026-11-18', jours });
        throw new Annulation();
      });
    } catch (erreur) {
      return erreur;
    }
    return null;
  }

  it('fenêtre du seul 18/11 (des trains) : accepté', async () => {
    expect(await calculer(0)).toBeInstanceOf(Annulation);
  });

  it('fenêtre jusqu’au 19/11 (aucun train) : bloquant', async () => {
    expect(await calculer(1)).toBeInstanceOf(ErreurControles);
  });
});
