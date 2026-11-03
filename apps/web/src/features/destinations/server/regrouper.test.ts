import { describe, expect, it } from 'vitest';

import { cleDestination, estHorsVille, type GareAtteinte, regrouperParVille } from './regrouper';

describe('estHorsVille et cleDestination (D049)', () => {
  it('« TGV » en mot entier : gare hors de la ville ; sinon non', () => {
    expect(estHorsVille('Belfort - Montbéliard TGV', 'TGV')).toBe(true);
    expect(estHorsVille('Valence TGV Rhône-Alpes Sud', 'TGV')).toBe(true);
    expect(estHorsVille('Besançon Viotte', 'TGV')).toBe(false);
    expect(estHorsVille('Gare de TGVille (exemple)', 'TGV')).toBe(false);
  });

  it('gare TGV → sa propre clé ; gare de ville → sa commune ; commune inconnue → la gare', () => {
    const base = { motHorsVille: 'TGV', cleCommune: 'Mâcon|71' };
    expect(cleDestination({ ...base, gareId: 31, nom: 'Mâcon Loché TGV' })).toBe('gare:31');
    expect(cleDestination({ ...base, gareId: 30, nom: 'Mâcon' })).toBe('Mâcon|71');
    expect(cleDestination({ ...base, gareId: 32, nom: 'Halte', cleCommune: null })).toBe('gare:32');
  });
});

type Gare = Partial<GareAtteinte> & Pick<GareAtteinte, 'gareId'> & { commune: string };

const gare = ({ commune, ...g }: Gare): GareAtteinte => ({
  cleDestination: commune,
  cleCommune: commune,
  dansRegion: true,
  dureeMin: 30,
  nbTrains: 10,
  nbLieux: 5,
  ...g,
});

// Cas réels du 03/11 (D047, D049, D050), valeurs simplifiées.
const gareDeLyon = gare({
  gareId: 1,
  commune: 'Paris|75',
  dansRegion: false,
  dureeMin: 96,
  nbTrains: 14,
  nbLieux: 0,
});
const bercy = gare({
  gareId: 2,
  commune: 'Paris|75',
  dansRegion: false,
  dureeMin: 172,
  nbTrains: 6,
  nbLieux: 0,
});
const beaune = gare({ gareId: 3, commune: 'Beaune|21', dureeMin: 22, nbTrains: 31 });
const porteNeuve = gare({ gareId: 4, commune: 'Dijon|21', dureeMin: 7, nbTrains: 20 });
const velars = gare({
  gareId: 5,
  commune: 'Velars-sur-Ouche|21',
  dureeMin: 6,
  nbTrains: 8,
  nbLieux: 0,
});
const toutes = [bercy, gareDeLyon, beaune, porteNeuve, velars];

const options = {
  cleCommuneDepart: 'Dijon|21',
  filtreEnvies: false,
  lieuxMinEnTete: 3,
  limite: 150,
};
const ids = (gares: readonly GareAtteinte[], o = options) =>
  regrouperParVille(gares, o).map((r) => r.tete.gareId);

describe('regrouperParVille — regroupement', () => {
  it('une seule destination « Paris », Gare de Lyon en tête (plus de trains), Bercy à côté', () => {
    const paris = regrouperParVille(toutes, options).find((r) => r.tete.gareId === 1);
    expect(paris?.autres.map((g) => g.gareId)).toEqual([2]);
    expect(ids(toutes)).not.toContain(2);
  });

  it('le plus de trains en tête, même plus lente (Belfort devant la halte de Danjoutin)', () => {
    const danjoutin = gare({ gareId: 20, commune: 'Belfort|90', nbTrains: 16, dureeMin: 5 });
    const belfort = gare({ gareId: 21, commune: 'Belfort|90', nbTrains: 32, dureeMin: 9 });
    expect(ids([danjoutin, belfort])).toEqual([21]);
  });

  it('à égalité de trains, la plus rapide en tête', () => {
    const a = gare({ gareId: 10, commune: 'X|01', nbTrains: 5, dureeMin: 40 });
    const b = gare({ gareId: 11, commune: 'X|01', nbTrains: 5, dureeMin: 35 });
    expect(ids([a, b])).toEqual([11]);
  });

  it('gare TGV dans la même commune qu’une gare de ville : deux destinations (D049)', () => {
    const macon = gare({ gareId: 30, commune: 'Mâcon|71', nbTrains: 24 });
    const loche = gare({ gareId: 31, commune: 'Mâcon|71', cleDestination: 'gare:31' });
    expect(ids([macon, loche])).toEqual([30, 31]);
  });
});

describe('regrouperParVille — exclusions', () => {
  it('même commune que le départ exclue (Dijon Porte Neuve) ; autre commune gardée', () => {
    expect(ids(toutes)).not.toContain(4);
    expect(ids(toutes, { ...options, cleCommuneDepart: 'Beaune|21' })).toContain(4);
  });

  it('gare TGV de la commune de départ : exclue aussi (même arrivée en ville ou non)', () => {
    const tgvDijon = gare({ gareId: 40, commune: 'Dijon|21', cleDestination: 'gare:40' });
    expect(ids([tgvDijon])).toEqual([]);
  });

  it('aucune durée minimale : une destination à 6 min reste listée', () => {
    expect(ids(toutes)).toContain(5);
  });
});

describe('regrouperParVille — peu de lieux (D050, seuil 3)', () => {
  it('tri par durée ; moins de 3 lieux → en fin de liste, pas supprimée', () => {
    const liste = regrouperParVille(toutes, options);
    expect(liste.map((r) => r.tete.gareId)).toEqual([3, 1, 5]);
    expect(liste.map((r) => r.peuDeLieux)).toEqual([false, false, true]);
  });

  it('2 lieux → fin de liste (Les Auxons derrière Besançon Viotte) ; 3 lieux → à sa place', () => {
    const auxons = gare({ gareId: 50, commune: 'gare:50', dureeMin: 26, nbLieux: 2 });
    const viotte = gare({ gareId: 51, commune: 'Besançon|25', dureeMin: 44, nbLieux: 94 });
    expect(ids([auxons, viotte])).toEqual([51, 50]);
    expect(ids([{ ...auxons, nbLieux: 3 }, viotte])).toEqual([50, 51]);
  });

  it('filtre des envies : 0 lieu → retirée ; 1 lieu → fin de liste ; hors région → gardée', () => {
    const unLieu = gare({ gareId: 60, commune: 'Rully|71', dureeMin: 39, nbLieux: 1 });
    const filtre = { ...options, filtreEnvies: true };
    expect(ids([...toutes, unLieu], filtre)).toEqual([3, 1, 60]);
    const lyon = regrouperParVille(toutes, filtre).find((r) => r.tete.gareId === 1);
    expect(lyon?.peuDeLieux).toBe(false);
  });

  it('limite : coupe la fin de la liste, pas le début', () => {
    expect(ids(toutes, { ...options, limite: 1 })).toEqual([3]);
  });
});
