import { describe, expect, it } from 'vitest';
import { apiGardeeHorsLigne, pageGardeeHorsLigne } from './routes-hors-ligne';

const u = (chemin: string) => new URL(chemin, 'https://exemple.test');

describe('apiGardeeHorsLigne', () => {
  for (const chemin of [
    '/api/destinations?gare=A&dureeMax=180',
    '/api/destinations/A?depuis=B',
    '/api/destinations/A/lieux',
    '/api/lieux?gare=A',
    '/api/lieux/cle',
    '/api/trains?depart=A&arrivee=B',
    '/api/mobilites/A',
    '/api/impact?depart=A&arrivee=B',
    '/api/sources',
  ]) {
    it(`garde ${chemin}`, () => expect(apiGardeeHorsLigne(u(chemin))).toBe(true));
  }
  // Règle 5 : ces routes reçoivent la position de l'utilisateur.
  for (const chemin of [
    '/api/autour?lat=47.3&lon=5&rayon=2000',
    '/api/gares/proches?lat=47.3&lon=5',
    '/api/geocodage/inverse?lat=47.3&lon=5',
    '/api/geocodage?q=dijon',
    '/api/sante',
    '/api/destinations?gare=A&lat=47.3',
  ]) {
    it(`ne garde jamais ${chemin}`, () => expect(apiGardeeHorsLigne(u(chemin))).toBe(false));
  }
});

describe('pageGardeeHorsLigne', () => {
  it('garde une page de l’application', () => {
    expect(pageGardeeHorsLigne(u('/destinations/A?depuis=B'))).toBe(true);
  });
  it('ne garde ni l’API ni une adresse avec une position', () => {
    expect(pageGardeeHorsLigne(u('/api/sources'))).toBe(false);
    expect(pageGardeeHorsLigne(u('/?lat=47.3&lon=5'))).toBe(false);
  });
});
