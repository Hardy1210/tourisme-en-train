// /api/destinations sur l'échantillon (db/echantillon/echantillon.sql, section E08) : liaisons au
// départ de Dijon-Ville le 18/11 (hiver) et le 15/07 (été). D047, D049, D050 (seuil de 3 lieux).
import { beforeAll, describe, expect, it } from 'vitest';

import { type Destination, schemaReponseDestinations } from '@/features/destinations/schemas';

import { appeler, erreurDe, type Route } from './outils-api';

let route: Route;
let service: typeof import('@/features/destinations/server/service');
/** Dijon-Ville dans l'échantillon : désignée par son code UIC (D052). */
const dijon = 'EX000001';

const HIVER = '2026-11-18';
const ETE = '2026-07-15';

async function liste(parametres: string): Promise<Destination[]> {
  const reponse = await appeler(route, `/api/destinations?gare=${dijon}&${parametres}`);
  expect(reponse.statut).toBe(200);
  return schemaReponseDestinations.parse(reponse.corps).destinations;
}

/** Titres des cartes, dans l'ordre. */
const villes = (destinations: Destination[]) => destinations.map((d) => d.titre);
const ville = (destinations: Destination[], titre: string) =>
  destinations.find((d) => d.titre === titre);

beforeAll(async () => {
  route = await import('@/app/api/destinations/route');
  service = await import('@/features/destinations/server/service');
});

describe('/api/destinations', () => {
  it('Beaune dans la tranche <30 (critère de la fiche E08), cache de 300 s', async () => {
    const reponse = await appeler(route, `/api/destinations?gare=${dijon}&date=${HIVER}`);
    expect(reponse.cache).toBe('public, max-age=300');
    const beaune = ville(schemaReponseDestinations.parse(reponse.corps).destinations, 'Beaune');
    expect(beaune).toMatchObject({ dureeMin: 22, trancheTemps: '<30', nbTrains: 2 });
  });

  it('une seule carte « Paris » : Gare de Lyon en tête (2 trains), Bercy à côté (1 train)', async () => {
    const destinations = await liste(`date=${HIVER}`);
    expect(villes(destinations).filter((v) => v === 'Paris')).toHaveLength(1);
    const paris = ville(destinations, 'Paris');
    expect(paris?.gare).toMatchObject({
      uic: 'EX000021',
      nom: 'Paris-Gare-de-Lyon',
      dansRegion: false,
    });
    expect(paris?.autresGares).toEqual([
      expect.objectContaining({ nom: 'Paris-Bercy', dureeMin: 172, nbTrains: 1 }),
    ]);
    expect(paris?.commune).toEqual({ nom: 'Paris', codeInsee: '75112' });
    expect(paris?.horsVille).toBe(false);
  });

  it('gare TGV : sa propre carte au nom de la gare, la commune dessous, même à Mâcon (D049)', async () => {
    const destinations = await liste(`date=${HIVER}`);
    expect(ville(destinations, 'Besançon Franche-Comté TGV')).toMatchObject({
      horsVille: true,
      commune: { nom: 'Les Auxons', codeInsee: '25035' },
    });
    expect(villes(destinations)).toEqual(expect.arrayContaining(['Mâcon', 'Mâcon Loché TGV']));
    expect(ville(destinations, 'Mâcon')?.autresGares).toEqual([]);
  });

  it('même commune que le départ exclue (Dijon-Porte-Neuve) ; aucune durée minimale (Velars, 15 min)', async () => {
    const destinations = await liste(`date=${HIVER}`);
    expect(villes(destinations)).not.toContain('Dijon');
    expect(villes(destinations)).toContain('Velars-sur-Ouche');
  });

  it('tri par durée ; moins de 3 lieux (région) en fin de liste, triées entre elles par durée', async () => {
    const destinations = await liste(`date=${HIVER}`);
    expect(villes(destinations)).toEqual([
      'Beaune', // 5 lieux
      'Paris', // hors région
      'Lyon',
      'Velars-sur-Ouche', // 0 lieu, 15 min
      'Besançon Franche-Comté TGV', // 2 lieux, 26 min
      'Chalon-sur-Saône', // 1 lieu, 40 min
      'Mâcon Loché TGV', // 0 lieu
      'Mâcon', // 0 lieu
    ]);
    expect(destinations.map((d) => d.peuDeLieux)).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
      true,
      true,
    ]);
  });

  it('filtre des envies : 0 lieu de la catégorie → retirée ; 1 → fin de liste ; hors région gardée', async () => {
    const destinations = await liste(`date=${HIVER}&categories=culture`);
    expect(villes(destinations)).toEqual(['Paris', 'Lyon', 'Beaune', 'Chalon-sur-Saône']);
    expect(ville(destinations, 'Beaune')).toMatchObject({
      lieuxParCategorie: { culture: 1 },
      peuDeLieux: true,
    });
    expect(ville(destinations, 'Lyon')).toMatchObject({ lieuxCharges: false, peuDeLieux: false });
  });

  it('pastilles : seulement les catégories qui ont des lieux', async () => {
    expect(ville(await liste(`date=${HIVER}`), 'Beaune')?.lieuxParCategorie).toEqual({
      patrimoine: 2,
      parcs: 1,
      culture: 1,
      enfants: 1,
    });
  });

  it('durée maximale 30 min : Beaune gardée (22 min), Chalon écartée (40 min)', async () => {
    expect(villes(await liste(`date=${HIVER}&dureeMax=30`))).toEqual([
      'Beaune',
      'Velars-sur-Ouche',
      'Besançon Franche-Comté TGV',
    ]);
  });

  it('horaires : premier départ, dernier retour, faisable dans la journée', async () => {
    const beaune = ville(await liste(`date=${HIVER}`), 'Beaune');
    expect(beaune?.premierDepart).toEqual({ s: 25200, texte: '07:00', lendemain: false });
    expect(beaune?.dernierRetour).toEqual({ s: 67440, texte: '18:44', lendemain: false });
    expect(beaune?.faisableJournee).toBe(true);
    expect(ville(await liste(`date=${HIVER}`), 'Velars-sur-Ouche')?.dernierRetour).toBeNull();
  });

  it('autre jour qu’aujourd’hui : prochain départ = premier train, avec son arrivée', async () => {
    const beaune = ville(await liste(`date=${HIVER}`), 'Beaune');
    expect(beaune?.prochainDepart?.texte).toBe('07:00');
    expect(beaune?.prochaineArrivee?.texte).toBe('07:22');
  });

  it('aujourd’hui à 10:00 : prochain vers Beaune à 23:50, arrivée 00:15 le lendemain ; vers Lyon à 10:00', async () => {
    const reponse = await service.destinations(
      { gare: dijon, date: undefined, categories: null, dureeMax: 180 },
      { dateDuJour: HIVER, heureActuelleS: 36000 },
    );
    expect(reponse.date).toBe(HIVER);
    const beaune = ville(reponse.destinations, 'Beaune');
    expect(beaune?.prochainDepart?.texte).toBe('23:50');
    expect(beaune?.prochaineArrivee).toEqual({ s: 87300, texte: '00:15', lendemain: true });
    expect(ville(reponse.destinations, 'Lyon')?.prochainDepart?.texte).toBe('10:00');
  });

  it('aujourd’hui à 23:55 : plus de train vers Beaune (prochain départ null)', async () => {
    const reponse = await service.destinations(
      { gare: dijon, date: undefined, categories: null, dureeMax: 180 },
      { dateDuJour: HIVER, heureActuelleS: 86100 },
    );
    expect(ville(reponse.destinations, 'Beaune')?.prochainDepart).toBeNull();
    expect(ville(reponse.destinations, 'Beaune')?.premierDepart.texte).toBe('07:00');
  });

  it('CO₂ et prix : TER + TGV vers Lyon → valeurs du TER ; Beaune ≈ 7–12 €', async () => {
    const destinations = await liste(`date=${HIVER}`);
    const beaune = ville(destinations, 'Beaune');
    expect(beaune?.prixEstime?.devise).toBe('EUR');
    expect(beaune?.co2EconomiseKg).toBeGreaterThan(0);
    const lyon = ville(destinations, 'Lyon');
    expect(lyon?.typesTrain).toEqual(['TER', 'TGV']);
    expect(lyon?.co2EconomiseKg).not.toBeNull();
  });

  it('date d’été : Dole et Besançon (ECH_ETE) présentes ; date d’hiver : absentes', async () => {
    expect(villes(await liste(`date=${ETE}`))).toEqual(
      expect.arrayContaining(['Dole', 'Besançon']),
    );
    expect(villes(await liste(`date=${HIVER}`))).not.toContain('Dole');
  });

  it('date hors fenêtre → 400 avec la fenêtre en clair ; date mal écrite → 400', async () => {
    const hors = await appeler(route, `/api/destinations?gare=${dijon}&date=2026-12-25`);
    expect(hors.statut).toBe(400);
    expect(erreurDe(hors.corps).message).toBe(
      'Les horaires sont disponibles du 15/07/2026 au 18/11/2026.',
    );
    const format = await appeler(route, `/api/destinations?gare=${dijon}&date=18/11/2026`);
    expect(erreurDe(format.corps).message).toBe('La date doit être au format AAAA-MM-JJ.');
  });

  it('code UIC inconnu → 404 ; mal formé → 400 ; absent → 400', async () => {
    const inconnue = await appeler(route, `/api/destinations?gare=87999999&date=${HIVER}`);
    expect(
      erreurDe((await appeler(route, `/api/destinations?gare=712&date=${HIVER}`)).corps).message,
    ).toBe('Le code UIC de la gare doit compter 8 chiffres.');
    expect(inconnue.statut).toBe(404);
    expect(erreurDe(inconnue.corps).code).toBe('INTROUVABLE');
    const absente = await appeler(route, `/api/destinations?date=${HIVER}`);
    expect(erreurDe(absente.corps).message).toBe('Le paramètre « gare » est obligatoire.');
  });
});
