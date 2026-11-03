// Routes /api/sante, /api/gares/proches, /api/autour sur l'échantillon (db/echantillon/echantillon.sql).
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { schemaReponseGaresProches } from '@/features/gares/schemas';
import { schemaReponseAutour } from '@/features/lieux/schemas';
import { schemaSante } from '@/features/sante/schemas';

import { appeler, erreurDe, type Route, urlTest } from './outils-api';

// Place Darcy (Dijon), à 600 m de Dijon-Ville.
const DARCY = 'lat=47.3226&lon=5.0353';

let sante: Route;
let garesProches: Route;
let autour: Route;
const proprietaire = new pg.Client({ connectionString: urlTest('BDD_URL_MIGRATIONS') });

beforeAll(async () => {
  sante = await import('@/app/api/sante/route');
  garesProches = await import('@/app/api/gares/proches/route');
  autour = await import('@/app/api/autour/route');
  await proprietaire.connect();
});
afterAll(() => proprietaire.end());

describe('/api/sante', () => {
  it('base joignable sans horaires chargés : 200, « degrade », jamais en cache', async () => {
    // Les tests de l'ETL partagent la base : on part d'un journal d'exécutions vide.
    await proprietaire.query(`DELETE FROM execution_etl`);
    const reponse = await appeler(sante, '/api/sante');
    expect(reponse.statut).toBe(200);
    expect(reponse.cache).toBe('no-store');
    expect(schemaSante.parse(reponse.corps)).toMatchObject({
      statut: 'degrade',
      base: 'ok',
      dateDonnees: null,
      version: '0.1.0',
    });
  });

  it('date des données à Paris : 23 h 30 UTC un soir d’hiver → le lendemain ; 21 h 30 UTC l’été → le jour même', async () => {
    const charger = (fin: string) =>
      proprietaire.query(
        `INSERT INTO execution_etl (source, debut, fin, statut) VALUES ('gtfs_sncf', $1, $1, 'SUCCES')`,
        [fin],
      );
    try {
      await charger('2026-11-17T23:30:00Z');
      expect(schemaSante.parse((await appeler(sante, '/api/sante')).corps)).toMatchObject({
        statut: 'ok',
        dateDonnees: '2026-11-18',
      });
      await proprietaire.query(`DELETE FROM execution_etl`);
      await charger('2026-07-15T21:30:00Z');
      expect(schemaSante.parse((await appeler(sante, '/api/sante')).corps).dateDonnees).toBe(
        '2026-07-15',
      );
    } finally {
      await proprietaire.query(`DELETE FROM execution_etl`);
    }
  });
});

describe('/api/gares/proches', () => {
  it('place Darcy : Dijon-Ville d’abord, 3 gares par défaut, durées vélo et voiture', async () => {
    const reponse = await appeler(garesProches, `/api/gares/proches?${DARCY}`);
    expect(reponse.statut).toBe(200);
    expect(reponse.cache).toBe('no-store');
    const { gares } = schemaReponseGaresProches.parse(reponse.corps);
    expect(gares).toHaveLength(3);
    expect(gares[0]).toMatchObject({ nom: 'Dijon-Ville', commune: 'Dijon', dansRegion: true });
    expect(gares[0]?.distanceM).toBeGreaterThan(500);
    expect(gares[0]?.distanceM).toBeLessThan(700);
    expect(gares[0]?.dureeVeloMin).toBe(4);
  });

  it('limite 10 acceptée, 11 refusée', async () => {
    expect((await appeler(garesProches, `/api/gares/proches?${DARCY}&limite=10`)).statut).toBe(200);
    const refus = await appeler(garesProches, `/api/gares/proches?${DARCY}&limite=11`);
    expect(refus.statut).toBe(400);
    expect(erreurDe(refus.corps).message).toBe('La limite doit être un entier entre 1 et 10.');
  });

  it('position hors France → 400 ; à Dijon → 200', async () => {
    const refus = await appeler(garesProches, '/api/gares/proches?lat=40.4&lon=-3.7');
    expect(refus.statut).toBe(400);
    expect(erreurDe(refus.corps)).toEqual({
      code: 'PARAMETRE_INVALIDE',
      message: 'La position doit se trouver en France métropolitaine.',
    });
    expect((await appeler(garesProches, `/api/gares/proches?${DARCY}`)).statut).toBe(200);
  });
});

describe('/api/autour', () => {
  const noms = async (chemin: string): Promise<string[]> =>
    schemaReponseAutour.parse((await appeler(autour, chemin)).corps).lieux.map((l) => l.nom);

  it('rayon 1 000 m à pied : la ludothèque (≈ 1 470 m à pied) absente ; 2 000 m : présente', async () => {
    expect(await noms(`/api/autour?${DARCY}&rayon=1000`)).not.toContain('Exemple - Ludothèque');
    expect(await noms(`/api/autour?${DARCY}&rayon=2000`)).toContain('Exemple - Ludothèque');
  });

  it('les plus proches d’abord, distance à pied et durée de marche', async () => {
    const reponse = schemaReponseAutour.parse(
      (await appeler(autour, `/api/autour?${DARCY}&rayon=1000`)).corps,
    );
    expect(reponse.lieux[0]?.nom).toBe('Exemple - Théâtre');
    const distances = reponse.lieux.map((l) => l.distanceM);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
    expect(reponse.total).toBe(reponse.lieux.length);
  });

  it('filtre des catégories : culture seulement', async () => {
    const reponse = schemaReponseAutour.parse(
      (await appeler(autour, `/api/autour?${DARCY}&categories=culture`)).corps,
    );
    expect(reponse.lieux.length).toBeGreaterThan(0);
    expect(reponse.lieux.every((l) => l.categorie === 'culture')).toBe(true);
  });

  it('doublon fusionné ignoré, lieu gardé présent (Beaune)', async () => {
    const autourDeBeaune = await noms('/api/autour?lat=47.0237&lon=4.8436&rayon=1000');
    expect(autourDeBeaune).toContain('Exemple - Hospices');
    expect(autourDeBeaune).not.toContain('Exemple - Hospices (doublon)');
  });

  it('rayon hors des options → 400 ; catégorie inconnue → 400', async () => {
    const rayon = await appeler(autour, `/api/autour?${DARCY}&rayon=1500`);
    expect(erreurDe(rayon.corps).message).toBe('Rayons (m) possibles : 1000, 2000, 5000, 10000.');
    expect((await appeler(autour, `/api/autour?${DARCY}&categories=plage`)).statut).toBe(400);
  });
});
